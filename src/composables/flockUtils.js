export function emptyFlock() {
  return { flockCode:'', breedId:'', houseId:'', supplier:'', healthCertificate:'', pricePerBird:'', receivedDate:'', initialAgeWeeks:'', initialCount:'', initialAverageWeightG:'', vaccinated:'' };
}
export function flockPayload(form) {
  return { ...form, flockCode:form.flockCode.trim(), supplier:form.supplier.trim(), healthCertificate:form.healthCertificate?.trim() || null,
    houseId:Number(form.houseId), breedId:Number(form.breedId), initialAgeWeeks:Number(form.initialAgeWeeks), initialCount:Number(form.initialCount) };
}
