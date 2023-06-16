import up from "~/up";

export const POST = async () => {
	up();

	return new Response(
		JSON.stringify({}),
		{
			status: 200,
			headers: {
				'Content-Type': 'application/json',
			}
		}
	)
}