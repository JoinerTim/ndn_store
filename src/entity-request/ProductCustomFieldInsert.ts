// IMPORT LIBRARY
import { Property } from "@tsed/schema";

// IMPORT CUSTOM
import { ProductCustomField } from '../entity/ProductCustomField';

export class ProductCustomFieldInsert {
    // Transform to draw entity
    async toProductCustomField() {
        const productCustomField = new ProductCustomField()

        productCustomField.id = this.id
        productCustomField.value = this.value
        productCustomField.valueEn = this.valueEn

        await productCustomField.assignCustomField(this.customFieldId)

        return productCustomField
    }

    // PROPERTIES
    @Property()
    id: number

    @Property()
    value: string

    @Property()
    valueEn: string

    @Property()
    customFieldId: number

} // END FILE
