import consola from "consola";

const validateLocation = (location: string) => {
  if (!location.startsWith("/")) {
    consola.error("Location should start by /");

    return;
  }
};

export default validateLocation;
