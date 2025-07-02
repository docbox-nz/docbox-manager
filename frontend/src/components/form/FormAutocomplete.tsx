import { type AnyFieldApi } from "@tanstack/react-form";
import Autocomplete, {
  type AutocompleteProps,
} from "@mui/material/Autocomplete";
import TextField, { type TextFieldProps } from "@mui/material/TextField";
import type { ChipTypeMap } from "@mui/material/Chip";

type FormTextFieldProps<
  Value,
  Multiple extends boolean | undefined,
  DisableClearable extends boolean | undefined,
  FreeSolo extends boolean | undefined,
  ChipComponent extends React.ElementType = ChipTypeMap["defaultComponent"],
> = Omit<
  AutocompleteProps<Value, Multiple, DisableClearable, FreeSolo, ChipComponent>,
  "name" | "value" | "onChange" | "error" | "renderInput"
> & {
  field: AnyFieldApi;
  inputProps?: Partial<TextFieldProps>;
};

export function FormAutocomplete<
  Value,
  Multiple extends boolean | undefined = false,
  DisableClearable extends boolean | undefined = false,
  FreeSolo extends boolean | undefined = false,
  ChipComponent extends React.ElementType = ChipTypeMap["defaultComponent"],
>({
  field,
  inputProps,
  ...rest
}: FormTextFieldProps<
  Value,
  Multiple,
  DisableClearable,
  FreeSolo,
  ChipComponent
>) {
  return (
    <Autocomplete
      {...rest}
      fullWidth
      value={field.state.value}
      onChange={(_event, newValue) => field.handleChange(newValue)}
      onBlur={field.handleBlur}
      renderInput={(params) => (
        <TextField
          {...params}
          {...inputProps}
          name={field.name}
          error={!field.state.meta.isValid}
          helperText={
            field.state.meta.isValid
              ? inputProps?.helperText
              : field.state.meta.errors
                  .map((error) => error?.message)
                  .join(", ")
          }
        />
      )}
    />
  );
}
