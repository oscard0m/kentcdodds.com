import {
	type SerializeFrom,
	json,
	type HeadersFunction,
	type LoaderFunctionArgs,
	type MetaFunction,
} from '@remix-run/node'
import { useLoaderData } from '@remix-run/react'
import * as React from 'react'
import { Grid } from '#app/components/grid.tsx'
import {
	BehanceIcon,
	CodepenIcon,
	DribbbleIcon,
	GithubIcon,
	GlobeIcon,
	InstagramIcon,
	LinkedInIcon,
	TwitchIcon,
	XIcon,
} from '#app/components/icons.tsx'
import { HeaderSection } from '#app/components/sections/header-section.tsx'
import {
	HeroSection,
	getHeroImageProps,
} from '#app/components/sections/hero-section.tsx'
import { Spacer } from '#app/components/spacer.tsx'
import { H2, H3, H6, Paragraph } from '#app/components/typography.tsx'
import {
	getImageBuilder,
	getImgProps,
	getSocialImageWithPreTitle,
	images,
} from '#app/images.tsx'
import { type RootLoaderType } from '#app/root.tsx'
import { shuffle } from '#app/utils/cjs/lodash.ts'
import { getPeople } from '#app/utils/credits.server.ts'
import {
	getDisplayUrl,
	getOrigin,
	getUrl,
	reuseUsefulLoaderHeaders,
} from '#app/utils/misc.tsx'
import { getSocialMetas } from '#app/utils/seo.ts'

export async function loader({ request }: LoaderFunctionArgs) {
	const people = await getPeople({ request })

	return json(
		{ people: shuffle(people) },
		{
			headers: {
				'Cache-Control': 'public, max-age=3600',
				Vary: 'Cookie',
			},
		},
	)
}

export const headers: HeadersFunction = reuseUsefulLoaderHeaders

export const meta: MetaFunction<typeof loader, { root: RootLoaderType }> = ({
	matches,
}) => {
	const requestInfo = matches.find((m) => m.id === 'root')?.data.requestInfo
	const domain = new URL(getOrigin(requestInfo)).host
	return getSocialMetas({
		title: `Who built ${domain}`,
		description: `It took a team of people to create ${domain}. This page will tell you a little bit about them.`,
		url: getUrl(requestInfo),
		image: getSocialImageWithPreTitle({
			url: getDisplayUrl(requestInfo),
			featuredImage: images.kentCodingOnCouch.id,
			title: `The fantastic people who built ${domain}`,
			preTitle: 'Check out these people',
		}),
	})
}

type Person = SerializeFrom<typeof loader>['people'][number]
type Socials = keyof Omit<
	Person,
	'name' | 'role' | 'cloudinaryId' | 'description'
>

const icons = {
	website: <GlobeIcon title="Website" />,
	github: <GithubIcon />,
	x: <XIcon />,
	instagram: <InstagramIcon />,
	dribbble: <DribbbleIcon />,
	codepen: <CodepenIcon />,
	twitch: <TwitchIcon />,
	linkedin: <LinkedInIcon />,
	behance: <BehanceIcon />,
} satisfies Record<Socials, React.ReactElement>

function ProfileCard({ person }: { person: Person }) {
	return (
		<div className="relative flex w-full flex-col">
			<div className="mb-8 aspect-[3/4] w-full flex-none">
				<img
					{...getImgProps(getImageBuilder(person.cloudinaryId), {
						className: 'rounded-lg object-cover',
						widths: [280, 560, 840, 1100, 1300, 1650],
						sizes: [
							'(max-width:639px) 80vw',
							'(min-width:640px) and (max-width:1023px) 40vw',
							'(min-width:1024px) and (max-width:1620px) 25vw',
							'410px',
						],
					})}
				/>
			</div>

			<div className="flex-auto">
				<div className="mb-4 text-xl font-medium lowercase text-slate-500">
					{person.role}
				</div>
				<H3 className="mb-6">{person.name}</H3>
				<Paragraph className="mb-8">{person.description}</Paragraph>
			</div>

			<div className="text-secondary flex flex-none space-x-4">
				{Object.entries(icons).map(([key, Icon]) => {
					const url = person[key as Socials]
					return url ? (
						<a
							key={key}
							href={url}
							className="hover:text-primary focus:text-primary"
						>
							{React.cloneElement(Icon, { size: 32 })}
						</a>
					) : null
				})}
			</div>
		</div>
	)
}

function CreditsIndex() {
	const data = useLoaderData<typeof loader>()
	return (
		<>
			<HeroSection
				title="Curious to see all the people who helped out making this website?"
				subtitle="Start scrolling to learn more about everyone involved."
				image={
					<img
						{...getHeroImageProps(images.kentCodingOnCouch, {
							className: 'rounded-lg',
							transformations: {
								resize: {
									aspectRatio: '3:4',
									type: 'crop',
								},
								gravity: 'face',
							},
						})}
					/>
				}
				arrowUrl="#intro"
				arrowLabel="Get to know more here"
			/>

			<Grid className="mb-24 lg:mb-64">
				<div className="col-span-full mb-12 lg:col-span-4 lg:mb-0">
					<H6 id="intro">{`Producing this site was a team effort`}</H6>
				</div>
				<div className="col-span-full mb-8 lg:col-span-8 lg:mb-20">
					<H2 className="mb-8">
						{`
              kentcdodds.com is more than just my developer portfolio. It's a
              place for me to share my thoughts, ideas, and experiences as
              well as the thoughts, ideas, and experiences of others (yourself
              included). It's a full fleged–`}
						<a
							target="_blank"
							rel="noreferrer noopener"
							href="https://github.com/kentcdodds/kentcdodds.com"
						>
							open source
						</a>
						{`–web application.`}
					</H2>
					<H2 variant="secondary" as="p">
						<a href="https://egghead.io?af=5236ad">egghead.io</a>
						{`
              and I have collaborated to make this website a
              truly high-quality and delightful learning experience for you and
              others.
            `}
					</H2>
				</div>
				<Paragraph className="lg:mb:0 col-span-full mb-4 lg:col-span-4 lg:col-start-5 lg:mr-12">
					{`
            It would be impossible to list everyone who has contributed to the
            creation of this website (I'd have to list my parents, teachers,
            etc, etc, etc).
          `}
				</Paragraph>
				<Paragraph className="col-span-full lg:col-span-4 lg:col-start-9 lg:mr-12">
					{`
            But hopefully with this page, you can get an idea of the primary
            group of folks who worked to make this site great.
          `}
				</Paragraph>
			</Grid>

			<HeaderSection
				className="mb-16"
				title="Everyone that helped out."
				subTitle="In no particular order."
			/>

			<Grid className="gap-y-20 lg:gap-y-32">
				{data.people.map((person) => (
					<div key={person.name} className="col-span-4">
						<ProfileCard person={person} />
					</div>
				))}
			</Grid>

			<Spacer size="base" />

			<HeaderSection
				title="Shout-outs"
				subTitle="Some other awesome folks"
				className="mb-16"
			/>
			<Grid className="prose prose-light gap-y-20 dark:prose-dark lg:gap-y-32">
				<Paragraph className="col-span-4">
					<a href="https://x.com/ryanflorence">Ryan Florence</a>
					{` and other friends at `}
					<a href="https://remix.run">Remix.run</a>
					{`
            were super helpful as I was figuring out the best way to rewrite my
            website in this new technology with completely new and improved
            features that far exceeded what my website had been previously.
          `}
				</Paragraph>
				<Paragraph className="col-span-4">
					The syntax highlighting theme in blog posts is inspired by{' '}
					<a href="https://x.com/sarah_edo">Sarah Drasner&apos;s</a>{' '}
					<a href="https://github.com/sdras/night-owl-vscode-theme">
						Night Owl
					</a>
					.
				</Paragraph>
				<Paragraph className="col-span-4">
					{`
            To prepare for the launch of this website, a number of terrific
            folks reviewed and
          `}
					<a href="https://github.com/kentcdodds/kentcdodds.com/issues?q=is%3Aissue">
						opened issues
					</a>
					{` and even made `}
					<a href="https://github.com/kentcdodds/kentcdodds.com/pulls?q=is%3Apr">
						pull requests
					</a>
					{` to get it ready for launch. Thank you!`}
				</Paragraph>
				<Paragraph className="col-span-4">
					{`The folks at `}
					<a href="https://fly.io">Fly.io</a>
					{`
            were an enormous help in getting me off the ground with hosting the
            site and databases. The backend is totally not my domain and they
            seriously helped me be successful.
          `}
				</Paragraph>
			</Grid>
		</>
	)
}

export default CreditsIndex
