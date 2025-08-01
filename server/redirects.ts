import { type RequestHandler } from 'express'
import {
	compile as compileRedirectPath,
	pathToRegexp,
	type Key,
} from 'path-to-regexp'

function typedBoolean<T>(
	value: T,
): value is Exclude<T, '' | 0 | false | null | undefined> {
	return Boolean(value)
}

function getRedirectsMiddleware({
	redirectsString,
}: {
	redirectsString: string
}): RequestHandler {
	const possibleMethods = ['HEAD', 'GET', 'POST', 'PUT', 'DELETE', 'PATCH', '*']
	const redirects = redirectsString
		.split('\n')
		.map((line, lineNumber) => {
			if (!line.trim() || line.startsWith('#')) return null

			let methods, from, to
			const [one, two, three] = line
				.split(' ')
				.map((l) => l.trim())
				.filter(Boolean)
			if (!one) return null

			const splitOne = one.split(',')
			if (possibleMethods.some((m) => splitOne.includes(m))) {
				methods = splitOne
				from = two
				to = three
			} else {
				methods = ['*']
				from = one
				to = two
			}

			if (!from || !to) {
				console.error(`Invalid redirect on line ${lineNumber + 1}: "${line}"`)
				return null
			}
			const keys: Array<Key> = []

			const toUrl = to.includes('//')
				? new URL(to)
				: new URL(`https://same_host${to}`)
			try {
				return {
					methods,
					from: pathToRegexp(from, keys),
					keys,
					toPathname: compileRedirectPath(toUrl.pathname, {
						encode: encodeURIComponent,
					}),
					toUrl,
				}
			} catch {
				// if parsing the redirect fails, we'll warn, but we won't crash
				console.error(
					`Failed to parse redirect on line ${lineNumber}: "${line}"`,
				)
				return null
			}
		})
		.filter(typedBoolean)

	return function redirectsMiddleware(req, res, next) {
		const host = req.header('X-Forwarded-Host') ?? req.header('host')
		const protocol = host?.includes('localhost') ? 'http' : 'https'
		let reqUrl
		try {
			reqUrl = new URL(`${protocol}://${host}${req.url}`)
		} catch {
			console.error(`Invalid URL: ${protocol}://${host}${req.url}`)
			next()
			return
		}
		for (const redirect of redirects) {
			try {
				if (
					!redirect.methods.includes('*') &&
					!redirect.methods.includes(req.method)
				) {
					continue
				}
				const match = req.path.match(redirect.from)
				if (!match) continue

				const params: Record<string, string> = {}
				const paramValues = match.slice(1)
				for (
					let paramIndex = 0;
					paramIndex < paramValues.length;
					paramIndex++
				) {
					const paramValue = paramValues[paramIndex]
					const key = redirect.keys[paramIndex]
					if (key && paramValue) {
						params[key.name] = paramValue
					}
				}
				const toUrl = new URL(redirect.toUrl)

				toUrl.protocol = protocol
				if (toUrl.host === 'same_host') toUrl.host = reqUrl.host

				for (const [key, value] of reqUrl.searchParams.entries()) {
					toUrl.searchParams.append(key, value)
				}
				toUrl.pathname = redirect.toPathname(params)
				res.redirect(307, toUrl.toString())
				return
			} catch (error: unknown) {
				// an error in the redirect shouldn't stop the request from going through
				console.error(`Error processing redirects:`, {
					error,
					redirect,
					'req.url': req.url,
				})
			}
		}
		next()
	}
}

export const oldImgSocial: RequestHandler = (req, res) => {
	res.redirect(
		'https://res.cloudinary.com/kentcdodds-com/image/upload/$th_1256,$tw_2400,$gw_$tw_div_24,$gh_$th_div_12/co_white,c_fit,g_north_west,w_$gw_mul_10,h_$gh_mul_7,x_$gw_mul_1.3,y_$gh_mul_1.5,l_text:kentcdodds.com:Matter-Regular.woff2_110:Helping%2520people%2520make%2520the%2520world%2520a%2520better%2520place%2520through%2520quality%2520software./c_fit,g_north_west,r_max,w_$gw_mul_4,h_$gh_mul_3,x_$gw,y_$gh_mul_8,l_kent:profile-transparent/co_rgb:a9adc1,c_fit,g_north_west,w_$gw_mul_5.5,h_$gh_mul_4,x_$gw_mul_4.5,y_$gh_mul_9,l_text:kentcdodds.com:Matter-Regular.woff2_70:Kent%20C.%20Dodds/co_rgb:a9adc1,c_fit,g_north_west,w_$gw_mul_5.5,x_$gw_mul_4.5,y_$gh_mul_9.8,l_text:kentcdodds.com:Matter-Regular.woff2_40:kentcdodds.com/c_fit,g_east,w_$gw_mul_11,h_$gh_mul_11,x_$gw,l_kentcdodds.com:illustrations:kody:kody_snowboarding_flying_blue/c_fill,w_$tw,h_$th/kentcdodds.com/social-background.png',
	)
}

export const rickRollMiddleware: RequestHandler = (req: any, res: any) => {
	return res.set('Content-Type', 'text/html').send(`
<!--
  this page is a joke. It allows me to do a client-side redirect so twitter
  won't show when I'm rick-rolling someone 🤭
-->
<script nonce=${res.locals.cspNonce}>
  var urlToRedirectTo = getQueryStringParam(location.href, 'url') || '/'
  window.location.replace(urlToRedirectTo)
  function getQueryStringParam(url, name) {
    var regexReadyName = name.replace(/[\\[]/, '\\[').replace(/[\\]]/, '\\]')
    var regex = new RegExp(\`[\\\\?&]\${regexReadyName}=([^&#]*)\`)
    var results = regex.exec(url)
    return results === null
      ? ''
      : decodeURIComponent(results[1].replace(/\\+/g, ' '))
  }
</script>
  `)
}

export { getRedirectsMiddleware }
