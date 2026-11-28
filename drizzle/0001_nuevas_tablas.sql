CREATE TABLE `movimientos_caja` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`fecha` text NOT NULL,
	`tipo` text NOT NULL,
	`monto` integer NOT NULL,
	`concepto` text,
	`usuario_id` integer,
	`pedido_id` integer,
	`creado_en` integer NOT NULL,
	FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`pedido_id`) REFERENCES `pedidos`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `caja_fecha` ON `movimientos_caja` (`fecha`);
--> statement-breakpoint
CREATE TABLE `asistencia` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`fecha` text NOT NULL,
	`usuario_id` integer NOT NULL,
	`entrada` integer,
	`salida` integer,
	`creado_en` integer NOT NULL,
	FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `asistencia_fecha_usuario` ON `asistencia` (`fecha`,`usuario_id`);
--> statement-breakpoint
CREATE TABLE `fotos_limpieza` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`fecha` text NOT NULL,
	`zona` text NOT NULL,
	`ruta` text NOT NULL,
	`usuario_id` integer,
	`creado_en` integer NOT NULL,
	FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `fotos_fecha` ON `fotos_limpieza` (`fecha`);
--> statement-breakpoint
CREATE TABLE `faltantes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`fecha` text NOT NULL,
	`nombre` text NOT NULL,
	`resuelto` integer DEFAULT false NOT NULL,
	`usuario_id` integer,
	`creado_en` integer NOT NULL,
	FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `faltantes_fecha` ON `faltantes` (`fecha`);
