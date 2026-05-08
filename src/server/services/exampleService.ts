import { logger } from '../logging/logger'

interface GetItemsOptions {
    limit: number
    offset: number
}

interface Item {
    id: number
    name: string
    createdAt: string
}

/**
 * Example service demonstrating the Service layer pattern
 * 
 * Services contain business logic and orchestrate operations.
 * Replace this with your actual implementation.
 */
class ExampleService {
    async getItems(options: GetItemsOptions): Promise<Item[]> {
        logger.debug({ options }, 'Fetching items')
        
        // Replace with actual data fetching logic
        const items = this.generateMockItems(options)
        
        return items
    }

    private generateMockItems(options: GetItemsOptions): Item[] {
        const items: Item[] = []
        for (let i = options.offset; i < options.offset + options.limit; i++) {
            items.push({
                id: i + 1,
                name: `Item ${i + 1}`,
                createdAt: new Date().toISOString(),
            })
        }
        return items
    }
}

// Export singleton instance
export const exampleService = new ExampleService()
