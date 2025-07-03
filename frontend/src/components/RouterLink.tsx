import * as React from "react";
import { Link, type LinkProps } from "@tanstack/react-router";

// Forward the ref to integrate with MUI correctly
const RouterLink = React.forwardRef<HTMLAnchorElement, LinkProps>(
  function RouterLink(props, ref) {
    return <Link {...props} ref={ref} />;
  }
);

export default RouterLink;
