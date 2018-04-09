<?php

declare(strict_types=1);

namespace Pim\Bundle\CatalogVolumeMonitoringBundle\Persistence\Query\Sql;

use Doctrine\DBAL\Connection;
use Pim\Component\CatalogVolumeMonitoring\Volume\Query\AverageMaxQuery;
use Pim\Component\CatalogVolumeMonitoring\Volume\ReadModel\AverageMaxVolumes;
use Pim\Component\CatalogVolumeMonitoring\Volume\ReadModel\CountVolume;

/**
 * @author    Elodie Raposo <elodie.raposo@akeneo.com>
 * @copyright 2018 Akeneo SAS (http://www.akeneo.com)
 * @license   http://opensource.org/licenses/osl-3.0.php  Open Software License (OSL 3.0)
 */
class AverageMaxProductValues implements AverageMaxQuery
{
    private const VOLUME_NAME = 'average_max_product_values';

    /** @var Connection */
    private $connection;

    /** @var int */
    private $limit;

    /**
     * @param Connection $connection
     */
    public function __construct(Connection $connection, int $limit)
    {
        $this->connection = $connection;
        $this->limit = $limit;
    }

    /**
     * {@inheritdoc}
     */
    public function fetch(): AverageMaxVolumes
    {
        $sql = <<<SQL
            SELECT CEIL((
              sp.sum_product_value +
              COALESCE(spm.sum_product_model_value, 0)
            ) / (
              sp.sum_product +
              COALESCE(spm.sum_product_model, 0)
            )) as average
            FROM (
              SELECT SUM(JSON_LENGTH(JSON_EXTRACT(raw_values, '$.*.*.*'))) as sum_product_value, count(*) as sum_product
              FROM pim_catalog_product
            ) as sp
            JOIN (
              SELECT SUM(JSON_LENGTH(JSON_EXTRACT(raw_values, '$.*.*.*'))) as sum_product_model_value, count(*) as sum_product_model
              FROM pim_catalog_product_model
            ) as spm;
SQL;
        $result = $this->connection->query($sql)->fetch();

        $sqlMax = <<<SQL
            SELECT GREATEST(sp.sum_product_value, spm.sum_product_model_value) as max
            FROM (
              SELECT COALESCE(MAX(JSON_LENGTH(JSON_EXTRACT(raw_values, '$.*.*.*'))), 0) as sum_product_value
              FROM pim_catalog_product
            ) as sp
            JOIN (
              SELECT COALESCE(MAX(JSON_LENGTH(JSON_EXTRACT(raw_values, '$.*.*.*'))), 0) as sum_product_model_value
              FROM pim_catalog_product_model
            ) as spm;
SQL;
        $resultMax = $this->connection->query($sqlMax)->fetch();

        $volume = new AverageMaxVolumes((int) $resultMax['max'], (int) $result['average'], $this->limit, self::VOLUME_NAME);

        return $volume;
    }
}
