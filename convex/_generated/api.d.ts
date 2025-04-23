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
import type * as characters from "../characters.js";
import type * as http from "../http.js";
import type * as lib_validators from "../lib/validators.js";
import type * as messages from "../messages.js";
import type * as roomAssets from "../roomAssets.js";
import type * as rooms from "../rooms.js";
import type * as storage from "../storage.js";

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
  characters: typeof characters;
  http: typeof http;
  "lib/validators": typeof lib_validators;
  messages: typeof messages;
  roomAssets: typeof roomAssets;
  rooms: typeof rooms;
  storage: typeof storage;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
