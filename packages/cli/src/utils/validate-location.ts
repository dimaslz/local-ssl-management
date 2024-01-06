const validateLocation = (location: string) => {
  if (!location.startsWith("/")) {
    throw new Error("Location should start by /");
  }
};

export default validateLocation;
