CREATE TABLE `insumos` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`nombre` text NOT NULL,
	`unidad` text NOT NULL,
	`stock` real DEFAULT 0 NOT NULL,
	`minimo` real DEFAULT 0 NOT NULL,
	`frecuencia` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `insumos_nombre_unique` ON `insumos` (`nombre`);--> statement-breakpoint
CREATE TABLE `movimientos_insumo` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`insumo_id` integer NOT NULL,
	`tipo` text NOT NULL,
	`cantidad` real NOT NULL,
	`pedido_id` integer,
	`nota` text,
	`creado_en` integer NOT NULL,
	FOREIGN KEY (`insumo_id`) REFERENCES `insumos`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`pedido_id`) REFERENCES `pedidos`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `mov_insumo` ON `movimientos_insumo` (`insumo_id`);--> statement-breakpoint
CREATE INDEX `mov_pedido` ON `movimientos_insumo` (`pedido_id`);--> statement-breakpoint
CREATE TABLE `opciones` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`producto_id` integer NOT NULL,
	`grupo` text NOT NULL,
	`nombre` text NOT NULL,
	`precio_extra` integer DEFAULT 0 NOT NULL,
	`tipo` text DEFAULT 'unica' NOT NULL,
	`por_defecto` integer DEFAULT false NOT NULL,
	FOREIGN KEY (`producto_id`) REFERENCES `productos`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `opciones_producto` ON `opciones` (`producto_id`);--> statement-breakpoint
CREATE TABLE `pedido_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`pedido_id` integer NOT NULL,
	`producto_id` integer,
	`nombre` text NOT NULL,
	`cantidad` integer NOT NULL,
	`precio_unit` integer NOT NULL,
	`opciones` text DEFAULT '[]' NOT NULL,
	`notas` text,
	FOREIGN KEY (`pedido_id`) REFERENCES `pedidos`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`producto_id`) REFERENCES `productos`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `items_pedido` ON `pedido_items` (`pedido_id`);--> statement-breakpoint
CREATE TABLE `pedidos` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`fecha` text NOT NULL,
	`turno` integer NOT NULL,
	`canal` text NOT NULL,
	`externo_id` text,
	`cliente` text,
	`telefono` text,
	`pago_metodo` text,
	`pago_estado` text DEFAULT 'pendiente' NOT NULL,
	`estado` text DEFAULT 'nuevo' NOT NULL,
	`total` integer NOT NULL,
	`notas` text,
	`creado_en` integer NOT NULL,
	`actualizado_en` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `pedidos_externo_id_unique` ON `pedidos` (`externo_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `pedidos_fecha_turno` ON `pedidos` (`fecha`,`turno`);--> statement-breakpoint
CREATE INDEX `pedidos_canal_estado` ON `pedidos` (`canal`,`estado`);--> statement-breakpoint
CREATE TABLE `productos` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`nombre` text NOT NULL,
	`descripcion` text DEFAULT '' NOT NULL,
	`categoria` text NOT NULL,
	`precio` integer NOT NULL,
	`foto` text,
	`activo` integer DEFAULT true NOT NULL,
	`orden` integer DEFAULT 0 NOT NULL,
	`sku_didi` text,
	`sku_rappi` text,
	`sku_uber` text
);
--> statement-breakpoint
CREATE TABLE `recetas` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`producto_id` integer,
	`opcion_id` integer,
	`insumo_id` integer NOT NULL,
	`cantidad` real NOT NULL,
	FOREIGN KEY (`producto_id`) REFERENCES `productos`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`opcion_id`) REFERENCES `opciones`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`insumo_id`) REFERENCES `insumos`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "recetas_un_dueno" CHECK(("recetas"."producto_id" IS NULL) <> ("recetas"."opcion_id" IS NULL))
);
--> statement-breakpoint
CREATE INDEX `recetas_producto` ON `recetas` (`producto_id`);--> statement-breakpoint
CREATE INDEX `recetas_opcion` ON `recetas` (`opcion_id`);--> statement-breakpoint
CREATE TABLE `usuarios` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`nombre` text NOT NULL,
	`rol` text NOT NULL,
	`pin_hash` text NOT NULL
);
