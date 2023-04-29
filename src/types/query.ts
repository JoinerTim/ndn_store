type MultiFiler = {
    type: 'multi-filter',
    field: string,
    value: string[]
}

type SingleFiler = {
    type: 'single-filter',
    field: string,
    value: string
}

type RangeFilter = {
    type: 'range',
    field: string
    value1: string
    value2: string
}

type SortType = {
    type: 'sort',
    field: string,
    value: 'ASC' | 'DESC'
}

/**
 * example: [{ type: 'single-filter', field: 'product.isHighlight', value: '1' }]
 */
export type QueryObject = SortType | SingleFiler | MultiFiler | RangeFilter;