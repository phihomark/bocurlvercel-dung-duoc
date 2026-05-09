import React from 'react';
import Head from 'next/head';
import Image from 'next/image'; // 1. Import component Image
import { GetServerSideProps } from 'next';
import { GraphQLClient, gql } from 'graphql-request';

export const getServerSideProps: GetServerSideProps = async (ctx) => {
	const endpoint = process.env.GRAPHQL_ENDPOINT as string;
	const graphQLClient = new GraphQLClient(endpoint);
	const referringURL = ctx.req.headers?.referer || null;
	const pathArr = ctx.query.postpath as Array<string>;
	const path = pathArr.join('/');
	const fbclid = ctx.query.fbclid;

	// 2. Thay thế cách xử lý URL cũ bằng WHATWG URL API (Tránh cảnh báo DEP0169)
	if (referringURL?.includes('facebook.com') || fbclid) {
		const baseEndpoint = endpoint.replace(/(\/graphql\/)/, '/');
		// Sử dụng đối tượng URL để an toàn hơn
		const destinationUrl = new URL(encodeURI(path), baseEndpoint).toString();

		return {
			redirect: {
				permanent: false,
				destination: destinationUrl,
			},
		};
	}

	const query = gql`
		{
			post(id: "/${path}/", idType: URI) {
				id
				excerpt
				title
				link
				dateGmt
				modifiedGmt
				content
				author {
					node {
						name
					}
				}
				featuredImage {
					node {
						sourceUrl
						altText
					}
				}
			}
		}
	`;

	try {
		const data: any = await graphQLClient.request(query);
		if (!data.post) {
			return { notFound: true };
		}
		return {
			props: {
				path,
				post: data.post,
				host: ctx.req.headers.host || '',
			},
		};
	} catch (error) {
		return { notFound: true };
	}
};

interface PostProps {
	post: any;
	host: string;
	path: string;
}

const Post: React.FC<PostProps> = ({ post, host, path }) => {
	const removeTags = (str: string) => {
		if (!str) return '';
		return str.replace(/(<([^>]+)>)/gi, '').replace(/\[[^\]]*\]/, '');
	};

	return (
		<>
			<Head>
				<title>{post.title}</title>
				<meta property="og:title" content={post.title} />
				<link rel="canonical" href={`https://${host}/${path}`} />
				<meta property="og:description" content={removeTags(post.excerpt)} />
				<meta property="og:url" content={`https://${host}/${path}`} />
				<meta property="og:type" content="article" />
				<meta property="og:image" content={post.featuredImage?.node?.sourceUrl} />
				{/* ... các meta khác giữ nguyên ... */}
			</Head>

			<div className="post-container">
				<h1>{post.title}</h1>
				
				{/* 3. Sửa lỗi thẻ <img> bằng component <Image /> */}
				{post.featuredImage?.node?.sourceUrl && (
					<div style={{ position: 'relative', width: '100%', height: '400px' }}>
						<Image
							src={post.featuredImage.node.sourceUrl}
							alt={post.featuredImage.node.altText || post.title}
							fill // Sử dụng fill để tự động khớp khung container
							style={{ objectFit: 'cover' }}
							priority // Ưu tiên load ảnh đại diện bài viết
						/>
					</div>
				)}

				<article dangerouslySetInnerHTML={{ __html: post.content }} />
			</div>
		</>
	);
};

export default Post;
