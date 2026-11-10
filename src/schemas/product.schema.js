// Validación del alta de productos. Refleja las restricciones de
// `src/models/product.model.js`: tipo, longitud, rango y nulabilidad.
// `ProductID` queda fuera a propósito: es autoincremental y lo genera la base.
import { z } from 'zod';

const MYSQL_INT_MAX = 2_147_483_647;
const SMALLINT_MAX = 32_767;

// INTEGER nullable; en el modelo es una FK a suppliers/categories.
const nullableForeignKey = z
    .number()
    .int()
    .positive()
    .max(MYSQL_INT_MAX)
    .nullable()
    .optional();

// SMALLINT nullable y no negativo, con default 0 en el modelo.
const nullableSmallInt = z
    .number()
    .int()
    .min(0) //alias de .nonnegative() + probar "No puede ser negativo"
    .max(SMALLINT_MAX)
    .nullable()
    .optional();


export const createProductSchema = z.strictObject({
    // VARCHAR(40) NOT NULL, sin default: es el único campo obligatorio.
    ProductName: z.string({ required_error: 'El nombre del producto es obligatorio', max_error: 'El nombre del producto no puede exceder los 40 caracteres' }).trim().min(1).max(40),
    SupplierID: nullableForeignKey,
    CategoryID: nullableForeignKey,
    // VARCHAR(20) nullable, sin default.
    QuantityPerUnit: z.string({ error: 'La cantidad por unidad no puede exceder los 20 caracteres' }).trim().max(20).nullable().optional(),
    // DOUBLE nullable, default 0.
    UnitPrice: z.number().nonnegative("Precio unitario no puede ser negativo").nullable().optional(),
    UnitsInStock: nullableSmallInt,
    UnitsOnOrder: nullableSmallInt,
    ReorderLevel: nullableSmallInt,
    // BOOLEAN NOT NULL, default false: se puede omitir, pero no enviar null.
    Discontinued: z.boolean().optional(),
});

//.strip() // descarta claves desconocidas en vez de fallar la validación.
