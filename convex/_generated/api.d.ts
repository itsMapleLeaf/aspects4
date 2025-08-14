/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as assets from "../assets.js";
import type * as auth from "../auth.js";
import type * as blocks from "../blocks.js";
import type * as http from "../http.js";
import type * as lib_errors from "../lib/errors.js";
import type * as lib_validators from "../lib/validators.js";
import type * as messages from "../messages.js";
import type * as rooms from "../rooms.js";
import type * as scenes from "../scenes.js";
import type * as sprites from "../sprites.js";
import type * as storage from "../storage.js";
import type * as users from "../users.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  assets: typeof assets;
  auth: typeof auth;
  blocks: typeof blocks;
  http: typeof http;
  "lib/errors": typeof lib_errors;
  "lib/validators": typeof lib_validators;
  messages: typeof messages;
  rooms: typeof rooms;
  scenes: typeof scenes;
  sprites: typeof sprites;
  storage: typeof storage;
  users: typeof users;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
