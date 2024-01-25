import consola from "consola";

export function validateLocation(location: string) {
  if (!location.startsWith("/")) {
    consola.error("Location should start by /");

    return;
  }
}
