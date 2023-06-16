<script lang="ts">
	import {
		Input,
		Label,
		Button,
		Modal,
	} from 'flowbite-svelte';
	import { TableList } from '@/components';
	import type Config from 'config.type.js';

	type Form = {
		domain: string;
		port: null | number;
	}

	export let data;
	let formModalToCreate = false;
	let formModalToEdit = false;
	let form: Form = {
		domain: "",
		port: null
	};

	const create = async () => {
		if (!form.domain || !form.port) return;

		const newData = await fetch("/api/config", {
			method: "POST",
			body: JSON.stringify({
				...form,
			}),
		}).then((d) => d.json());

		data.items = newData;
		formModalToCreate = false;
	}

	const edit = async () => {
		if (!form.domain || !form.port) return;

		const newData = await fetch(`/api/config/${form.domain}`, {
			method: "PUT",
			body: JSON.stringify({
				port: form.port,
			}),
		}).then((d) => d.json());

		data.items = newData;
		formModalToEdit = false;
	}

	const deploy = async () => {
		await fetch("/api/deploy", {
			method: "POST",
		});
	}

	const onDelete = async (domain: string) => {
		await fetch(`/api/config/${domain}`, {
			method: "DELETE",
		})

		data.items = await fetch(`/api/config`).then((d: any) => d.json());
	}

	const onEdit = async (domain: string) => {
		formModalToEdit = true;
		const item = data.items.find((d: Config) => d.domain === domain);
		form.domain = item.domain;
		form.port = item.port;
	}
</script>

<svelte:head>
	<title>Home</title>
	<meta name="description" content="Svelte demo app" />
</svelte:head>

<section class="flex flex-col justify-center items-start w-full">
	<div class="w-full">
		<div class="w-full flex justify-end space-x-4">
			<Button color="alternative" on:click={() => formModalToCreate = true}>+ add</Button>
			<Button color="red" on:click={deploy}>🚀 deploy</Button>
		</div>
		<TableList data={data.items} class="mt-12" onEdit={onEdit} onDelete={onDelete} />
	</div>
</section>

<Modal bind:open={formModalToCreate} size="xs" autoclose={false} class="w-full">
  <div class="flex flex-col space-y-6">
    <h3 class="mb-4 text-xl font-medium text-gray-900 dark:text-white">Application</h3>
    <Label class="space-y-2">
      <span>Domain</span>
      <Input name="domain" placeholder="local.your-domain.tld" required bind:value={form.domain} />
    </Label>
    <Label class="space-y-2">
      <span>Port</span>
      <Input type="number" name="port" placeholder="2000" required bind:value={form.port} />
    </Label>

    <Button type="submit" class="w-full" on:click={create}>create</Button>
  </div>
</Modal>

<Modal bind:open={formModalToEdit} size="xs" autoclose={false} class="w-full">
  <div class="flex flex-col space-y-6">
    <h3 class="mb-4 text-xl font-medium text-gray-900 dark:text-white">Application</h3>
    <Label class="space-y-2">
      <span>Domain</span>
      <Input name="domain" placeholder="local.your-domain.tld" required bind:value={form.domain} disabled />
    </Label>
    <Label class="space-y-2">
      <span>Port</span>
      <Input type="number" name="port" placeholder="2000" required bind:value={form.port} />
    </Label>

    <Button type="submit" class="w-full" on:click={edit}>create</Button>
  </div>
</Modal>