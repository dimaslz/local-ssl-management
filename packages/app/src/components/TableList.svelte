<script lang="ts">
  import {
		Table,
		TableBody,
		TableBodyCell,
		TableBodyRow,
		TableHead,
		TableHeadCell
	} from 'flowbite-svelte';

	import { CrossIcon, EditIcon } from '@/components';
	import type Config from 'config.type';

	export let data: Config[] = [];
	export let onEdit: (s: string) => void = () => ({});
	export let onDelete: (s: string) => void = () => ({});
</script>

<Table { ...$$restProps } striped hoverable>
  <TableHead>
    <TableHeadCell class="!px-2">domain name</TableHeadCell>
    <TableHeadCell class="!px-2">port</TableHeadCell>
    <TableHeadCell class="!px-2"></TableHeadCell>
    <TableHeadCell class="!px-2"></TableHeadCell>
  </TableHead>
  <TableBody tableBodyClass="divide-y">
		{#each data as item}
    <TableBodyRow class="hover:cursor-pointer">
			<TableBodyCell tdClass="p-2">{item.domain}</TableBodyCell>
      <TableBodyCell tdClass="p-2">{item.port}</TableBodyCell>
      <TableBodyCell tdClass="p-2">
				<button
					class="hover:bg-slate-800 rounded-full p-1"
					on:click={() => onDelete(item.domain)}
				>
					<CrossIcon class="text-red-600" />
				</button>
			</TableBodyCell>
      <TableBodyCell tdClass="p-2">
				<button
					class="hover:bg-slate-800 rounded-full p-1"
					on:click={() => onEdit(item.domain)}
				>
					<EditIcon class="text-slate-100" />
				</button>
			</TableBodyCell>
    </TableBodyRow>
		{/each}
  </TableBody>
</Table>