const fetcherRegistry = require('pim/fetcher-registry');
import ProductInterface, {
  Product,
  ProductModel,
  RawProductInterface,
  ModelType,
} from 'pimfront/product-grid/domain/model/product';
import {ServerResponse} from 'pimfront/product-grid/infrastructure/fetcher/product';
import hidrateAll from 'pimfront/app/application/hidrator/hidrator';
import {dataReceived, childrenReceived} from 'pimfront/product-grid/domain/event/search';
import {State} from 'pimfront/product-grid/application/reducer/main';
import {startLoading, stopLoading, goNextPage, goFirstPage} from 'pimfront/grid/application/event/search';
import {NormalizedFilter} from 'pimfront/product-grid/domain/model/filter/filter';

export const productHidrator = (product: RawProductInterface): ProductInterface => {
  switch (product.meta.model_type) {
    case ModelType.Product:
      return Product.create(product);
    case ModelType.ProductModel:
      return ProductModel.create(product);
    default:
      throw new Error(`Cannot handle model type ${product.meta.model_type}`);
  }
};

interface QueryFilter {
  field: string;
  operator: string;
  value: any;
  context: any;
}

interface Query {
  locale: string;
  channel: string;
  limit: number;
  page: number;
  filters: QueryFilter[];
}

const stateToQuery = (state: State<Product>): Query => {
  return {
    locale: undefined === state.user.catalogLocale ? '' : state.user.catalogLocale,
    channel: undefined === state.user.catalogChannel ? '' : state.user.catalogChannel,
    limit: state.grid.query.limit,
    page: state.grid.query.page,
    filters: state.grid.query.filters.map((filter: NormalizedFilter): QueryFilter => ({
      field: filter.field,
      operator: filter.operator,
      value: filter.value,
      context: {},
    })),
  };
};

const fetchResults = async (query: Query): Promise<{products: ProductInterface[]; total: number}> => {
  const [err, {items, total}]: [any, ServerResponse] = await fetcherRegistry.getFetcher('product-grid').search(query);

  if (null !== err) {
    // TODO: handle error here
  }

  return {products: hidrateAll<ProductInterface>(productHidrator)(items), total};
};

export const updateResults = (append: boolean = false) => async (dispatch: any, getState: any): Promise<void> => {
  if (getState().grid.isFetching) {
    return Promise.resolve();
  }

  dispatch(startLoading());

  if (false === append) {
    dispatch(goFirstPage());
  }

  const {products, total} = await fetchResults(stateToQuery(getState()));

  dispatch(dataReceived(products, total, append));
  dispatch(stopLoading());
};

export const needMoreResults = () => (dispatch: any, getState: any) => {
  if (
    !getState().grid.isFetching &&
    getState().grid.items.length < 500 &&
    getState().grid.items.length < getState().grid.total
  ) {
    dispatch(goNextPage());
    dispatch(updateResults(true));
  }
};

export const loadChildren = (product: ProductInterface) => async (dispatch: any, getState: any): Promise<void> => {
  const query = stateToQuery(getState());
  query.filters = [
    ...query.filters.filter((filter: QueryFilter) => 'parent' !== filter.field),
    {
      field: 'parent',
      operator: 'IN',
      value: [product.getIdentifier()],
      context: {},
    },
  ];

  query.page = 0;

  const {products} = await fetchResults(query);

  dispatch(childrenReceived(product.getIdentifier(), products));
};
