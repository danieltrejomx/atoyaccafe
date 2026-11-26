import { crearApi } from '$lib/api';
import type { Producto } from '$lib/types';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ fetch }) => ({
	productos: await crearApi(fetch).productos().catch((): Producto[] | null => null)
});
