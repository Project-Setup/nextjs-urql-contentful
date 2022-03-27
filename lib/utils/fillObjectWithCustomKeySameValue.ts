const fillObjectWithCustomKeySameValue = (keyArray: string[], value: any) =>
  keyArray.reduce<{ [k: string]: any }>(
    (obj, key) => ({ ...obj, [key]: value }),
    {}
  );

export default fillObjectWithCustomKeySameValue;
