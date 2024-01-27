import shell from "shelljs";

import { listConfigs } from "@/utils/list-configs";

describe("Utils - listConfigs", () => {
  test("list configs", () => {
    const configs = [
      {
        id: "d7274462-e2cc-4ed3-8b07-fea3e342e7aa",
        domain: "local.some-domain.tld",
        services: [
          {
            id: "29ecf855-5262-4b53-b742-03c8505abf2f",
            location: "/",
            port: "3333",
          },
          {
            id: "3cbf00b7-4fdd-4d37-8634-575c969faa15",
            location: "/app-name",
            port: "3000",
          },
        ],
      },
    ];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (vi.spyOn(shell, "exec") as any).mockImplementation(() => ({
      stdout: 200,
    }));

    listConfigs(configs);

    expect(shell.echo).matchSnapshot();
  });
});
