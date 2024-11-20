import { ServerClient } from 'postmark';
import { stripIndents } from 'common-tags';

interface Env {
	POSTMARK_API_KEY: string;
	PRESIDENT_EMAIL: string;
	VP_OPERATIONS_EMAIL: string;
	VP_EQUITY_EMAIL: string;
	VP_COMMUNICATIONS_EMAIL: string;
	VP_EXTERNAL_EMAIL: string;
	VP_STUDENT_LIFE_EMAIL: string;
	VP_FINANCE_EMAIL: string;
	VP_ACADEMICS_EMAIL: string;
	TECH_COMMITTEE_EMAIL: string;
	ORIGIN_URL: string;
}

interface RequestBody {
	email: string;
	firstName: string;
	lastName: string;
	message: string;
	natureOfRequest: string;
	program: string;
	subject: string;
	year: string;
}

export default {
	async fetch(req, env): Promise<Response> {
		if (req.method === "OPTIONS") {
			return handleOptions(req, env);
		}


		const client = new ServerClient(env.POSTMARK_API_KEY);

		const emailMap: Record<string, string> = {
			'Finance Request': env.VP_FINANCE_EMAIL,
			'Locker Request': env.VP_OPERATIONS_EMAIL,
			'Website Request': env.TECH_COMMITTEE_EMAIL,
			'Merchandise Request': env.VP_COMMUNICATIONS_EMAIL,
			'Science Lounge Booking': env.VP_OPERATIONS_EMAIL,
			'Events Request': env.VP_STUDENT_LIFE_EMAIL,
			'Academics Request': env.VP_ACADEMICS_EMAIL,
			'Equity Request': env.VP_EQUITY_EMAIL,
			'General Inquiry': env.VP_OPERATIONS_EMAIL,
		};

		try {
			const body: RequestBody = await req.json();

			const textMessage = stripIndents`
			Sender: ${body.firstName} ${body.lastName}
			TMU Email: ${body.email}
			Program: ${body.program}
			Year: ${body.year.replace("Year ", "")}
			Nature of Request: ${body.natureOfRequest}
         	Message:

			${body.message}
			`;

			const htmlMessage = `
			<strong>Sender:</strong> ${body.firstName} ${body.lastName}
			<br>
			<strong>TMU Email:</strong> ${body.email}
			<br>
			<strong>Program:</strong> ${body.program}
			<br>
			<strong>Year:</strong> ${body.year.replace("Year ", "")}
			<br>
			<strong>Nature of Request:</strong> ${body.natureOfRequest}
			<br>
         	<strong>Message:</strong>
			<br><br>
			${body.message}
			`;

			const res = await client.sendEmail({
				From: env.TECH_COMMITTEE_EMAIL,
				To: emailMap[body.natureOfRequest],
				Subject: `[usstm.ca Contact Form] - ${body.subject}`,
				ReplyTo: body.email,
				TextBody: textMessage,
				HtmlBody: htmlMessage,
			});

			if (res.ErrorCode !== 0) {
				console.error(res.ErrorCode);
				console.error(res.Message);
				return new Response('Internal Server Error', { status: 500 });
			}

			return new Response('Success', {
				status: 200,
				headers: {
					'Access-Control-Allow-Origin': env.ORIGIN_URL,
					'Access-Control-Allow-Methods': 'POST',
					'Access-Control-Max-Age': '86400',
				},
			});
		} catch (e) {
			console.error(e);
			return new Response('Bad Request', { status: 400 });
		}
	},
} satisfies ExportedHandler<Env>;

function handleOptions(req: Request<unknown, IncomingRequestCfProperties<unknown>>, env: Env) {
	const headers = req.headers;

	if (
		headers.get('Origin') !== null &&
		headers.get('Access-Control-Request-Method') !== null &&
		headers.get('Access-Control-Request-Headers') !== null
	) {
		return new Response(null, {
			headers: {
				'Access-Control-Allow-Origin': env.ORIGIN_URL,
				'Access-Control-Allow-Methods': 'POST, OPTIONS',
				'Access-Control-Max-Age': '86400',
				'Access-Control-Allow-Headers': req.headers.get('Access-Control-Request-Headers') as string,
			},
		});
	} else {
		return new Response(null, {
			headers: {
				Allow: 'POST, OPTIONS',
			},
		});
	}
}
