import consola from "consola";
import fs from "fs";

import { HOSTS_END, HOSTS_START } from "@/constants";
import {
  getContentFromHosts,
  setContentToHosts,
  updateHosts,
} from "@/utils/hosts";

vi.mock("@/utils/update-system-hosts");

describe("Utils - getContentFromHosts, setContentToHosts, updateHosts", () => {
  test("move domain if already exists without Local SSL config slot", async () => {
    vi.spyOn(fs, "readFileSync").mockReturnValue(`
127.0.0.1       				localhost
127.0.0.1               other-domain.com
`);

    const result = await getContentFromHosts();

    // read files
    expect(fs.readFileSync).toBeCalledTimes(1);
    expect(fs.readFileSync).nthCalledWith(1, "/etc/hosts", {
      encoding: "utf8",
    });

    // write files
    expect(fs.writeFileSync).not.toBeCalled();

    expect(result).toBe("");
  });

  test("get hosts content without Local SSL config slot", async () => {
    vi.spyOn(fs, "readFileSync").mockReturnValue(`
127.0.0.1               localhost
127.0.0.1               other-domain.com
`);

    const result = await getContentFromHosts();

    // read files
    expect(fs.readFileSync).toBeCalledTimes(1);
    expect(fs.readFileSync).nthCalledWith(1, "/etc/hosts", {
      encoding: "utf8",
    });

    // write files
    expect(fs.writeFileSync).not.toBeCalled();

    expect(result).toBe("");
  });

  test("get hosts content with Local SSL config slot", async () => {
    vi.spyOn(fs, "readFileSync").mockReturnValue(`
127.0.0.1               localhost

${HOSTS_START}
127.0.0.1               local.domain.com
127.0.0.1               local.domain.dev
${HOSTS_END}

127.0.0.1               other-domain.com
`);

    const result = await getContentFromHosts();

    // read files
    expect(fs.readFileSync).toBeCalledTimes(1);
    expect(fs.readFileSync).nthCalledWith(1, "/etc/hosts", {
      encoding: "utf8",
    });

    // write files
    expect(fs.writeFileSync).not.toBeCalled();

    expect(result).toBe(
      `
127.0.0.1               local.domain.com
127.0.0.1               local.domain.dev
`.trim(),
    );
  });

  test("set hosts content without Local SSL config slot", async () => {
    vi.spyOn(consola, "prompt").mockReturnValue(Promise.resolve(true));
    vi.spyOn(fs, "writeFileSync").mockImplementation(vi.fn());
    vi.spyOn(fs, "readFileSync").mockReturnValue(`
127.0.0.1               localhost
127.0.0.1               other-domain.com
`);

    await setContentToHosts(
      `
127.0.0.1               local.domain.io
127.0.0.1               local.domain.net
`.trim(),
    );

    expect(fs.readFileSync).toBeCalledTimes(1);
    expect(fs.readFileSync).toHaveBeenNthCalledWith(1, "/etc/hosts", {
      encoding: "utf8",
    });

    expect(fs.writeFileSync).toBeCalledTimes(1);
    expect(fs.writeFileSync).toBeCalledWith(
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
    vi.spyOn(fs, "readFileSync").mockReturnValue(`
127.0.0.1               localhost

${HOSTS_START}
127.0.0.1               local.domain.com
127.0.0.1               local.domain.dev
${HOSTS_END}

127.0.0.1               other-domain.com
`);

    await setContentToHosts(
      `
127.0.0.1               local.domain.io
127.0.0.1               local.domain.net
`.trim(),
    );

    // read files
    expect(fs.readFileSync).toBeCalledTimes(1);
    expect(fs.readFileSync).nthCalledWith(1, "/etc/hosts", {
      encoding: "utf8",
    });

    // write files
    expect(fs.writeFileSync).toBeCalledTimes(1);
    expect(fs.writeFileSync).toBeCalledWith(
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
    vi.spyOn(fs, "readFileSync").mockReturnValueOnce(`
127.0.0.1               localhost

${HOSTS_START}
127.0.0.1               local.domain.com
127.0.0.1               local.domain.dev
${HOSTS_END}

127.0.0.1               other-domain.com
`).mockReturnValueOnce(`
127.0.0.1               localhost

${HOSTS_START}
127.0.0.1               local.domain.com
127.0.0.1               local.domain.dev
${HOSTS_END}
`).mockReturnValueOnce(`
127.0.0.1               localhost

${HOSTS_START}
127.0.0.1               local.domain.com
127.0.0.1               local.domain.dev
127.0.0.1               other-domain.com
${HOSTS_END}
`);

    await updateHosts("other-domain.com");

    // read files
    expect(fs.readFileSync).toBeCalledTimes(3);
    expect(fs.readFileSync).nthCalledWith(1, "/etc/hosts", {
      encoding: "utf8",
    });
    expect(fs.readFileSync).nthCalledWith(2, "/etc/hosts", {
      encoding: "utf8",
    });
    expect(fs.readFileSync).nthCalledWith(3, "/etc/hosts", {
      encoding: "utf8",
    });

    // write files
    expect(fs.writeFileSync).toBeCalledTimes(2);
    expect(fs.writeFileSync).nthCalledWith(
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
    expect(fs.writeFileSync).nthCalledWith(
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
    vi.spyOn(fs, "readFileSync").mockReturnValueOnce(`
127.0.0.1               localhost

${HOSTS_START}
127.0.0.1               local.domain.com
127.0.0.1               local.domain.dev
${HOSTS_END}
`).mockReturnValueOnce(`
127.0.0.1               localhost

${HOSTS_START}
127.0.0.1               local.domain.com
127.0.0.1               local.domain.dev
${HOSTS_END}
`).mockReturnValueOnce(`
127.0.0.1               localhost

${HOSTS_START}
127.0.0.1               local.domain.com
127.0.0.1               local.domain.dev
127.0.0.1               other-domain.com
${HOSTS_END}
`);

    await updateHosts("other-domain.com");

    // read files
    expect(fs.readFileSync).toBeCalledTimes(3);
    expect(fs.readFileSync).nthCalledWith(1, "/etc/hosts", {
      encoding: "utf8",
    });
    expect(fs.readFileSync).nthCalledWith(2, "/etc/hosts", {
      encoding: "utf8",
    });
    expect(fs.readFileSync).nthCalledWith(3, "/etc/hosts", {
      encoding: "utf8",
    });

    // write files
    expect(fs.writeFileSync).toBeCalledTimes(1);
    expect(fs.writeFileSync).nthCalledWith(
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
    vi.spyOn(fs, "readFileSync").mockReturnValueOnce(`
127.0.0.1               localhost

${HOSTS_START}
127.0.0.1               local.domain.com
127.0.0.1               local.domain.dev
127.0.0.1               other-domain.com
${HOSTS_END}

`).mockReturnValueOnce(`
127.0.0.1               localhost

${HOSTS_START}
127.0.0.1               local.domain.com
127.0.0.1               local.domain.dev
127.0.0.1               other-domain.com
${HOSTS_END}
`).mockReturnValueOnce(`
127.0.0.1               localhost

${HOSTS_START}
127.0.0.1               local.domain.com
127.0.0.1               local.domain.dev
127.0.0.1               other-domain.com
${HOSTS_END}
`);

    await updateHosts("other-domain.com");

    // read files
    expect(fs.readFileSync).toBeCalledTimes(2);
    expect(fs.readFileSync).nthCalledWith(1, "/etc/hosts", {
      encoding: "utf8",
    });
    expect(fs.readFileSync).nthCalledWith(2, "/etc/hosts", {
      encoding: "utf8",
    });

    expect(fs.writeFileSync).not.toBeCalled();
  });
});
