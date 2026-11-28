CREATE TABLE `checklist` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`fecha` text NOT NULL,
	`tarea` text NOT NULL,
	`ronda` integer NOT NULL DEFAULT 1,
	`foto` text,
	`nota` text,
	`usuario_id` integer,
	`completado_en` integer NOT NULL,
	FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `checklist_fecha` ON `checklist` (`fecha`);
--> statement-breakpoint
CREATE UNIQUE INDEX `checklist_fecha_tarea_ronda` ON `checklist` (`fecha`,`tarea`,`ronda`);
