'use client';

// =============================================================
// FILE: src/app/(main)/admin/(admin)/resources/admin-resources-client.tsx
// FINAL — Admin Resources
// =============================================================

import * as React from 'react';
import { useAdminUiCopy } from '@/app/(main)/admin/_components/common/useAdminUiCopy';
import { useListResourcesAdminQuery } from '@/integrations/hooks';

import { ResourcesHeader, type ResourcesFilters } from '../ResourcesHeader';
import { ResourcesList } from '../ResourcesList';

export default function AdminResourcesClient() {
  const { copy } = useAdminUiCopy();
  const page = copy.pages?.resources ?? {};

  const [filters, setFilters] = React.useState<ResourcesFilters>({
    q: '',
    type: '',
    status: 'all',
    sort: 'updated_at',
    order: 'desc',
  });

  const params = React.useMemo(
    () => ({
      q: filters.q || undefined,
      type: filters.type || undefined,
      status: filters.status === 'all' ? undefined : filters.status,
      sort: filters.sort,
      order: filters.order,
      limit: 200,
    }),
    [filters],
  );

  const { data: resources = [], isLoading, refetch } = useListResourcesAdminQuery(params);

  return (
    <div className="space-y-6">
      <ResourcesHeader
        filters={filters}
        total={resources.length}
        loading={isLoading}
        onFiltersChange={setFilters}
        onRefresh={refetch}
      />

      <ResourcesList items={resources} loading={isLoading} />
    </div>
  );
}
