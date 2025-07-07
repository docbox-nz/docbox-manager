use axum::{
    body::Body,
    http::{HeaderValue, Request},
    response::{IntoResponse, Response},
};
use embeddy::Embedded;
use futures::future::BoxFuture;
use hyper::{StatusCode, ext, header::CONTENT_TYPE};
use std::{
    convert::Infallible,
    path::Path,
    task::{Context, Poll},
};
use tower::Service;

/// Embed frontend content
#[derive(Clone, Embedded)]
#[folder = "frontend/dist"]
pub struct PublicContent;

impl Service<Request<Body>> for PublicContent {
    type Response = Response;
    type Error = Infallible;
    type Future = BoxFuture<'static, Result<Self::Response, Self::Error>>;

    fn poll_ready(&mut self, _cx: &mut Context<'_>) -> Poll<Result<(), Self::Error>> {
        Poll::Ready(Ok(()))
    }

    fn call(&mut self, req: Request<Body>) -> Self::Future {
        let path = req.uri().path();

        // Strip the leading slash in order to match paths correctly
        let mut path = match path.strip_prefix('/') {
            Some(value) => value.to_string(),
            None => path.to_string(),
        };

        let std_path = Path::new(&path);

        // Determine type using extension
        let extension: String = match std_path.extension() {
            // Extract the extension
            Some(value) => value.to_string_lossy().to_string(),
            // Use the index file when responding to paths (For SPA dashboard support)
            None => {
                path = "index.html".to_string();
                "html".to_string()
            }
        };

        Box::pin(async move {
            let path = path;

            let mime = mime_guess::from_ext(&extension).first_or_text_plain();
            let mime_header = match HeaderValue::from_str(mime.to_string().as_ref()) {
                Ok(value) => value,
                Err(_) => return Ok(StatusCode::INTERNAL_SERVER_ERROR.into_response()),
            };

            // File exists within binary serve that
            if let Some(contents) = Self::get(&path) {
                // Create byte response from the embedded file
                let mut response = Body::from(contents).into_response();
                response.headers_mut().insert(CONTENT_TYPE, mime_header);
                return Ok(response);
            }

            // All above failed server 404
            Ok(StatusCode::NOT_FOUND.into_response())
        })
    }
}
