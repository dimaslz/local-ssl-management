import consola from "consola";
import fs from "fs";
import shell from "shelljs";

import onListAction from "@/on-list-action";

describe("Actions - onListAction", () => {
  test("no domains available", () => {
    vi.spyOn(fs, "readFileSync").mockReturnValue("[]");

    onListAction();

    expect(consola.box).toBeCalledWith(`Does not exists configs yet.`);
  });

  test("list domains availables", () => {
    vi.spyOn(fs, "readFileSync").mockReturnValue(
      JSON.stringify([
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
      ]),
    );

    vi.spyOn(shell, "exec")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .mockImplementationOnce((): any => ({
        stdout: 200,
      }))
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .mockImplementationOnce((): any => ({
        stdout: 404,
      }));

    onListAction();

    expect(shell.echo).toBeCalledTimes(1);
    expect(shell.echo).toMatchSnapshot();

    expect(shell.exec).toBeCalledTimes(2);
    expect(shell.exec).nthCalledWith(
      1,
      'curl -s -o /dev/null -w "%{http_code}" https://local.some-domain.tld/',
      { silent: true },
    );
    expect(shell.exec).nthCalledWith(
      2,
      'curl -s -o /dev/null -w "%{http_code}" https://local.some-domain.tld/app-name',
      { silent: true },
    );
  });
});
