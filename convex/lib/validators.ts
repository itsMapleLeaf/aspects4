import { v, Validator } from "convex/values"

export function vector() {
	return v.object({ x: v.number(), y: v.number() })
}

export function optionull<T, FieldPaths extends string>(
	validator: Validator<T, "required", FieldPaths>,
) {
	return v.optional(v.union(validator, v.null()))
}
