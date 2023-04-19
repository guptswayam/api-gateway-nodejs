function ROUND_ROBIN(service) {
  // const newIndex =  ++service.index >= service.instances.length ? 0 : service.index;
  const newIndex = ++service.index % service.instances.length;
  service.index = newIndex
  return newIndex
}

function LEAST_USED(index) {

}

module.exports = {
  ROUND_ROBIN,
  LEAST_USED
}