import consola from "consola";
import fs from "fs/promises";

import { HOSTS_END, HOSTS_START } from "@/constants";

import { getContentFromHosts, setContentToHosts, updateHosts } from "./hosts";

vi.mock("path", () => ({
  default: {
    resolve: () => "/root/path",
  },
}));

describe("Utils - hosts", () => {
  test("move domain if already exists without Local SSL config slot", async () => {
    vi.spyOn(fs, "readFile").mockReturnValue(
      Promise.resolve(`
127.0.0.1       				localhost
127.0.0.1               other-domain.com
`),
    );

    const result = await getContentFromHosts();

    expect(result).toBe("");
  });

  test("get hosts content without Local SSL config slot", async () => {
    vi.spyOn(fs, "readFile").mockReturnValue(
      Promise.resolve(`
127.0.0.1               localhost
127.0.0.1               other-domain.com
`),
    );

    const result = await getContentFromHosts();

    expect(result).toBe("");
  });

  test("get hosts content with Local SSL config slot", async () => {
    vi.spyOn(fs, "readFile").mockReturnValue(
      Promise.resolve(`
127.0.0.1               localhost

${HOSTS_START}
127.0.0.1               local.domain.com
127.0.0.1               local.domain.dev
${HOSTS_END}

127.0.0.1               other-domain.com
`),
    );

    const result = await getContentFromHosts();

    expect(result).toBe(
      `
127.0.0.1               local.domain.com
127.0.0.1               local.domain.dev
`.trim(),
    );
  });

  test("set hosts content without Local SSL config slot", async () => {
    vi.spyOn(consola, "prompt").mockReturnValue(Promise.resolve(true));
    vi.spyOn(fs, "readFile").mockReturnValue(
      Promise.resolve(`
127.0.0.1               localhost
127.0.0.1               other-domain.com
`),
    );

    vi.spyOn(fs, "writeFile").mockImplementation(vi.fn());

    await setContentToHosts(
      `
127.0.0.1               local.domain.io
127.0.0.1               local.domain.net
`.trim(),
    );

    expect(fs.writeFile).toBeCalledWith(
      expect.stringMatching(/\/root\/path\/.tmp-hosts/i),
      `
127.0.0.1               localhost
127.0.0.1               other-domain.com


${HOSTS_START}
127.0.0.1               local.domain.io
127.0.0.1               local.domain.net
${HOSTS_END}
`,
    );
  });

  test("set hosts content with Local SSL config slot", async () => {
    vi.spyOn(consola, "prompt").mockReturnValue(Promise.resolve(true));
    vi.spyOn(fs, "readFile").mockReturnValue(
      Promise.resolve(`
127.0.0.1               localhost

${HOSTS_START}
127.0.0.1               local.domain.com
127.0.0.1               local.domain.dev
${HOSTS_END}

127.0.0.1               other-domain.com
`),
    );

    vi.spyOn(fs, "writeFile").mockImplementation(vi.fn());

    await setContentToHosts(
      `
127.0.0.1               local.domain.io
127.0.0.1               local.domain.net
`.trim(),
    );

    expect(fs.writeFile).toBeCalledWith(
      expect.stringMatching(/\/root\/path\/.tmp-hosts/i),
      `
127.0.0.1               localhost

${HOSTS_START}
127.0.0.1               local.domain.io
127.0.0.1               local.domain.net
${HOSTS_END}

127.0.0.1               other-domain.com
`,
    );
  });

  test("update hosts where a domain already exists outside Local SSL config slot", async () => {
    vi.spyOn(consola, "prompt").mockReturnValue(Promise.resolve(true));
    vi.spyOn(fs, "readFile")
      .mockReturnValueOnce(
        Promise.resolve(`
127.0.0.1               localhost

${HOSTS_START}
127.0.0.1               local.domain.com
127.0.0.1               local.domain.dev
${HOSTS_END}

127.0.0.1               other-domain.com
`),
      )
      .mockReturnValueOnce(
        Promise.resolve(`
127.0.0.1               localhost

${HOSTS_START}
127.0.0.1               local.domain.com
127.0.0.1               local.domain.dev
${HOSTS_END}
`),
      )
      .mockReturnValueOnce(
        Promise.resolve(`
127.0.0.1               localhost

${HOSTS_START}
127.0.0.1               local.domain.com
127.0.0.1               local.domain.dev
127.0.0.1               other-domain.com
${HOSTS_END}
`),
      );

    vi.spyOn(fs, "writeFile").mockImplementation(vi.fn());

    await updateHosts("other-domain.com");

    expect(fs.writeFile).nthCalledWith(
      1,
      expect.stringMatching(/\/root\/path\/.tmp-hosts/i),
      `
127.0.0.1               localhost

${HOSTS_START}
127.0.0.1               local.domain.com
127.0.0.1               local.domain.dev
${HOSTS_END}
`,
    );
    expect(fs.writeFile).nthCalledWith(
      2,
      expect.stringMatching(/\/root\/path\/.tmp-hosts/i),
      `
127.0.0.1               localhost

${HOSTS_START}
127.0.0.1               local.domain.com
127.0.0.1               local.domain.dev
127.0.0.1               other-domain.com
${HOSTS_END}
`,
    );
  });

  test("update hosts where a domain does not exists inside/outside Local SSL config slot", async () => {
    vi.spyOn(consola, "prompt").mockReturnValue(Promise.resolve(true));
    vi.spyOn(fs, "readFile")
      .mockReturnValueOnce(
        Promise.resolve(`
127.0.0.1               localhost

${HOSTS_START}
127.0.0.1               local.domain.com
127.0.0.1               local.domain.dev
${HOSTS_END}
`),
      )
      .mockReturnValueOnce(
        Promise.resolve(`
127.0.0.1               localhost

${HOSTS_START}
127.0.0.1               local.domain.com
127.0.0.1               local.domain.dev
${HOSTS_END}
`),
      )
      .mockReturnValueOnce(
        Promise.resolve(`
127.0.0.1               localhost

${HOSTS_START}
127.0.0.1               local.domain.com
127.0.0.1               local.domain.dev
127.0.0.1               other-domain.com
${HOSTS_END}
`),
      );

    vi.spyOn(fs, "writeFile").mockImplementation(vi.fn());

    await updateHosts("other-domain.com");

    expect(fs.writeFile).nthCalledWith(
      1,
      expect.stringMatching(/\/root\/path\/.tmp-hosts/i),
      `
127.0.0.1               localhost

${HOSTS_START}
127.0.0.1               local.domain.com
127.0.0.1               local.domain.dev
127.0.0.1               other-domain.com
${HOSTS_END}
`,
    );
  });

  test("update hosts where a domain already exists into Local SSL slot", async () => {
    vi.spyOn(fs, "readFile")
      .mockReturnValueOnce(
        Promise.resolve(`
127.0.0.1               localhost

${HOSTS_START}
127.0.0.1               local.domain.com
127.0.0.1               local.domain.dev
127.0.0.1               other-domain.com
${HOSTS_END}

`),
      )
      .mockReturnValueOnce(
        Promise.resolve(`
127.0.0.1               localhost

${HOSTS_START}
127.0.0.1               local.domain.com
127.0.0.1               local.domain.dev
127.0.0.1               other-domain.com
${HOSTS_END}
`),
      )
      .mockReturnValueOnce(
        Promise.resolve(`
127.0.0.1               localhost

${HOSTS_START}
127.0.0.1               local.domain.com
127.0.0.1               local.domain.dev
127.0.0.1               other-domain.com
${HOSTS_END}
`),
      );

    vi.spyOn(fs, "writeFile").mockImplementation(vi.fn());

    await updateHosts("other-domain.com");

    expect(fs.writeFile).not.toBeCalled();
  });
});
