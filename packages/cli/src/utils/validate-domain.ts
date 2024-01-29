import isUrlHttp from "is-url-http";

export function validateDomain(value: string) {
  const domains = value.split(",").map((d) => `https://${d.trim()}`);

  domains.forEach((domainItem) => {
    let domain = domainItem;

    // include validate domains like .local or .test
    if (/\.local$|\.test$/g.test(domainItem)) {
      domain = domain.replace(/\.local$|\.test$/, ".com");
    }

    if (!isUrlHttp(domain)) {
      throw new Error(`Domain (${domainItem}) format is not valid`);
    }
  });
}
