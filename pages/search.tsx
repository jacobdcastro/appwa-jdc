import cn from 'classnames'
import type { GetStaticPropsContext, InferGetStaticPropsType } from 'next'
import { useRouter } from 'next/router'
import { getConfig } from '@bigcommerce/storefront-data-hooks/api'
import getAllPages from '@bigcommerce/storefront-data-hooks/api/operations/get-all-pages'
import getSiteInfo from '@bigcommerce/storefront-data-hooks/api/operations/get-site-info'
import useSearch from '@bigcommerce/storefront-data-hooks/products/use-search'
import { Layout } from '@components/common'
import { ProductCard } from '@components/product'
import {
  Container,
  Grid,
  SearchFilter,
  Skeleton,
  SortBySelect,
} from '@components/ui'

import rangeMap from '@lib/range-map'
import getSlug from '@lib/get-slug'
import { useSearchMeta } from '@lib/search'

export async function getStaticProps({
  preview,
  locale,
}: GetStaticPropsContext) {
  const config = getConfig({ locale })
  const { pages } = await getAllPages({ config, preview })
  const { categories, brands } = await getSiteInfo({ config, preview })

  return {
    props: { pages, categories, brands },
  }
}

export default function Search({
  categories,
  brands,
}: InferGetStaticPropsType<typeof getStaticProps>) {
  const router = useRouter()
  const { asPath } = router
  const { q, sort } = router.query
  // `q` can be included but because categories and designers can't be searched
  // in the same way of products, it's better to ignore the search input if one
  // of those is selected

  const { category, brand } = useSearchMeta(asPath)
  const activeCategory = categories.find(
    (cat) => getSlug(cat.path) === category
  )
  const activeBrand = brands.find(
    (b) => getSlug(b.node.path) === `brands/${brand}`
  )?.node

  const { data } = useSearch({
    search: typeof q === 'string' ? q : '',
    categoryId: activeCategory?.entityId,
    brandId: activeBrand?.entityId,
    sort: typeof sort === 'string' ? sort : '',
  })

  return (
    <Container>
      <div className="grid grid-cols-12 gap-6 mt-3 mb-20 mx-auto max-w-8xl">
        <SearchFilter
          className="hidden md:block md:col-start-1 md:col-span-3 lg:col-start-2 lg:col-span-2"
          activeCategory={activeCategory}
          activeBrand={activeBrand}
          categories={categories}
          brands={brands}
        />

        <div className="col-span-12 md:col-span-9 lg:col-span-8">
          <div className="flex items-center justify-between">
            {(q || activeCategory || activeBrand) && (
              <div className="transition ease-in duration-75">
                {data ? (
                  <>
                    <span
                      className={cn('animated', {
                        fadeIn: data.found,
                        hidden: !data.found,
                      })}
                    >
                      Showing {data.products.length} results{' '}
                      {q && (
                        <>
                          for "<strong>{q}</strong>"
                        </>
                      )}
                    </span>
                    <span
                      className={cn('animated', {
                        fadeIn: !data.found,
                        hidden: data.found,
                      })}
                    >
                      {q ? (
                        <>
                          There are no products that match "<strong>{q}</strong>
                          "
                        </>
                      ) : (
                        <>
                          There are no products that match the selected category
                          &amp; designer
                        </>
                      )}
                    </span>
                  </>
                ) : q ? (
                  <>
                    Searching for: "<strong>{q}</strong>"
                  </>
                ) : (
                  <>Searching...</>
                )}
              </div>
            )}
            <SortBySelect data={data} sort={sort} />
          </div>

          {data ? (
            <Grid layout="normal">
              {data.products.map(({ node }) => (
                <ProductCard
                  variation="responsive"
                  key={node.path}
                  className="animated fadeIn"
                  product={node}
                  imgWidth={480}
                  imgHeight={480}
                />
              ))}
            </Grid>
          ) : (
            <Grid layout="normal">
              {rangeMap(12, (i) => (
                <Skeleton
                  key={i}
                  className="w-full animated fadeIn"
                  height={325}
                />
              ))}
            </Grid>
          )}
        </div>
      </div>
    </Container>
  )
}

Search.Layout = Layout
