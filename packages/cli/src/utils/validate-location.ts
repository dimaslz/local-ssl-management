import consola from "consola";
import shell from "shelljs";

const validateLocation = (location: string) => {
  if (!location.startsWith("/")) {
    consola.error(new Error("Location should start by /"));
    shell.exit(1);
  }
};

export default validateLocation;
