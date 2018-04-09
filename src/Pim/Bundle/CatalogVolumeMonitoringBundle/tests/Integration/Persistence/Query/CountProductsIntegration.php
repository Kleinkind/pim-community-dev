<?php

declare(strict_types=1);

namespace Pim\Bundle\CatalogVolumeMonitoringBundle\tests\Integration\Persistence\Query;

use PHPUnit\Framework\Assert;
use Pim\Bundle\CatalogVolumeMonitoringBundle\tests\Integration\Persistence\BuilderQueryTestCase;

class CountProductsIntegration extends BuilderQueryTestCase
{
    public function testGetCountOfProducts()
    {
        $query = $this->get('pim_volume_monitoring.persistence.query.count_products');
        $this->createProducts(8);

        $volume = $query->fetch();

        Assert::assertEquals(8, $volume->getVolume());
        Assert::assertEquals('count_products', $volume->getVolumeName());
        Assert::assertEquals(false, $volume->hasWarning());
    }

    /**
     * @param int $numberOfProducts
     */
    protected function createProducts(int $numberOfProducts) : void
    {
        $i = 0;

        while ($i < $numberOfProducts) {
            $this->createProduct([
                'identifier' => 'new_product_'.rand()
            ]);
            $i++;
        }
    }
}
