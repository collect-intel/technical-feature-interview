// CIP fork feature (see FORK.md): the point-function registry, ported from
// weval-org/app src/point-functions/index.ts (MIT, see ./NOTICE.md).
import type { PointFunction } from "./types.ts";
import { contains } from "./contains.ts";
import { matches } from "./matches.ts";
import { is_json } from "./is_json.ts";
import { starts_with } from "./starts_with.ts";
import { word_count_between } from "./word_count_between.ts";
import { contains_any_of } from "./contains_any_of.ts";
import { icontains } from "./icontains.ts";
import { imatches } from "./imatches.ts";
import { ends_with } from "./ends_with.ts";
import { contains_all_of } from "./contains_all_of.ts";
import { matches_all_of } from "./matches_all_of.ts";
import { imatch_all_of } from "./imatch_all_of.ts";
import { contains_at_least_n_of } from "./contains_at_least_n_of.ts";
import { icontains_at_least_n_of } from "./icontains_at_least_n_of.ts";
import { matches_at_least_n_of } from "./matches_at_least_n_of.ts";
import { imatch_at_least_n_of } from "./imatch_at_least_n_of.ts";
import { icontains_all_of } from "./icontains_all_of.ts";
import { icontains_any_of } from "./icontains_any_of.ts";
import { istarts_with } from "./istarts_with.ts";
import { iends_with } from "./iends_with.ts";

// Import Unicode-aware word boundary functions
import { contains_word } from "./contains_word.ts";
import { icontains_word } from "./icontains_word.ts";
import { not_contains_word } from "./not_contains_word.ts";
import { not_icontains_word } from "./not_icontains_word.ts";

// Import negative variants
import { not_contains } from "./not_contains.ts";
import { not_icontains } from "./not_icontains.ts";
import { not_contains_any_of } from "./not_contains_any_of.ts";
import { not_icontains_any_of } from "./not_icontains_any_of.ts";
import { not_contains_all_of } from "./not_contains_all_of.ts";
import { not_icontains_all_of } from "./not_icontains_all_of.ts";
import { not_matches } from "./not_matches.ts";
import { not_imatches } from "./not_imatches.ts";
import { not_starts_with } from "./not_starts_with.ts";
import { not_istarts_with } from "./not_istarts_with.ts";
import { not_ends_with } from "./not_ends_with.ts";
import { not_iends_with } from "./not_iends_with.ts";

/**
 * Weval's point-function registry, including its singular aliases. `call`/
 * `external` and `factcheck` reach external services and are not ported; the
 * `tool_*` functions need tool-call traces Studio generations do not record.
 */
export const pointFunctions: Record<string, PointFunction> = {
  contains,
  contain: contains,
  matches,
  match: matches,
  is_json,
  starts_with,
  ends_with,
  word_count_between,
  contains_any_of,
  contains_all_of,
  contain_all_of: contains_all_of,
  matches_all_of,
  match_all_of: matches_all_of,
  imatch_all_of,
  icontains,
  icontain: icontains,
  imatches,
  imatch: imatches,
  icontains_all_of,
  icontain_all_of: icontains_all_of,
  icontains_any_of,
  icontain_any_of: icontains_any_of,
  istarts_with,
  istart_with: istarts_with,
  iends_with,
  iend_with: iends_with,
  contains_at_least_n_of,
  contain_at_least_n_of: contains_at_least_n_of,
  icontains_at_least_n_of,
  icontain_at_least_n_of: icontains_at_least_n_of,
  matches_at_least_n_of,
  match_at_least_n_of: matches_at_least_n_of,
  imatch_at_least_n_of,

  // Unicode-aware word boundary functions
  contains_word,
  contain_word: contains_word,
  icontains_word,
  icontain_word: icontains_word,

  // Negative variants
  not_contains,
  not_contain: not_contains,
  not_icontains,
  not_icontain: not_icontains,
  not_contains_any_of,
  not_contain_any_of: not_contains_any_of,
  not_icontains_any_of,
  not_icontain_any_of: not_icontains_any_of,
  not_contains_all_of,
  not_contain_all_of: not_contains_all_of,
  not_icontains_all_of,
  not_icontain_all_of: not_icontains_all_of,
  not_matches,
  not_match: not_matches,
  not_imatches,
  not_imatch: not_imatches,
  not_starts_with,
  not_start_with: not_starts_with,
  not_istarts_with,
  not_istart_with: not_istarts_with,
  not_ends_with,
  not_end_with: not_ends_with,
  not_iends_with,
  not_iend_with: not_iends_with,

  // Negative Unicode-aware word boundary functions
  not_contains_word,
  not_contain_word: not_contains_word,
  not_icontains_word,
  not_icontain_word: not_icontains_word,
};

/** Functions weval supports that Studio deliberately does not run. */
export const UNSUPPORTED_POINT_FUNCTIONS = [
  "call",
  "external",
  "factcheck",
  "tool_called",
  "tool_args_match",
  "tool_call_count_between",
  "tool_call_order",
] as const;

export type {
  PointFunction,
  PointFunctionContext,
  PointFunctionReturn,
} from "./types.ts";
