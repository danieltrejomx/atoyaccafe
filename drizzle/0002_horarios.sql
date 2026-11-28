CREATE TABLE `horarios` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`semana` text NOT NULL,
	`dia` integer NOT NULL,
	`hora` integer NOT NULL,
	`empleado` text NOT NULL DEFAULT '',
	`actualizado_en` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `horarios_semana_dia_hora` ON `horarios` (`semana`,`dia`,`hora`);
--> statement-breakpoint
CREATE INDEX `horarios_semana` ON `horarios` (`semana`);
--> statement-breakpoint
-- Empleados del café
INSERT INTO `usuarios` (`nombre`, `rol`, `pin_hash`) VALUES ('Claudia', 'cocina', 'empleado:nologin_claudia');
--> statement-breakpoint
INSERT INTO `usuarios` (`nombre`, `rol`, `pin_hash`) VALUES ('Daniel', 'cocina', 'empleado:nologin_daniel');
