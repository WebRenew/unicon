CREATE TABLE `icons` (
	`id` text PRIMARY KEY NOT NULL,
	`source_id` text NOT NULL,
	`name` text NOT NULL,
	`normalized_name` text NOT NULL,
	`category` text,
	`tags` text,
	`view_box` text NOT NULL,
	`content` text NOT NULL,
	`path_data` text,
	`default_stroke` integer,
	`default_fill` integer,
	`stroke_width` text,
	`search_text` text,
	`embedding` blob,
	`brand_color` text,
	FOREIGN KEY (`source_id`) REFERENCES `sources`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `icons_source_idx` ON `icons` (`source_id`);--> statement-breakpoint
CREATE INDEX `icons_normalized_name_idx` ON `icons` (`normalized_name`);--> statement-breakpoint
CREATE INDEX `icons_category_idx` ON `icons` (`category`);--> statement-breakpoint
CREATE TABLE `mappings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`canonical_name` text NOT NULL,
	`lucide_id` text,
	`phosphor_id` text,
	`hugeicons_id` text,
	`confidence` integer,
	`needs_review` integer,
	FOREIGN KEY (`lucide_id`) REFERENCES `icons`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`phosphor_id`) REFERENCES `icons`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`hugeicons_id`) REFERENCES `icons`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `mappings_canonical_idx` ON `mappings` (`canonical_name`);--> statement-breakpoint
CREATE TABLE `search_analytics` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`query` text NOT NULL,
	`search_type` text NOT NULL,
	`source_filter` text,
	`result_count` integer NOT NULL,
	`cache_hit` integer NOT NULL,
	`response_time_ms` integer,
	`timestamp` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `search_analytics_query_idx` ON `search_analytics` (`query`);--> statement-breakpoint
CREATE INDEX `search_analytics_timestamp_idx` ON `search_analytics` (`timestamp`);--> statement-breakpoint
CREATE TABLE `sources` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`version` text NOT NULL,
	`license` text,
	`total_icons` integer,
	`extracted_at` integer
);
--> statement-breakpoint
CREATE TABLE `variants` (
	`id` text PRIMARY KEY NOT NULL,
	`icon_id` text NOT NULL,
	`variant` text NOT NULL,
	`content` text NOT NULL,
	`path_data` text,
	FOREIGN KEY (`icon_id`) REFERENCES `icons`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `variants_icon_idx` ON `variants` (`icon_id`);--> statement-breakpoint
CREATE INDEX `variants_variant_idx` ON `variants` (`variant`);