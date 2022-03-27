const getClientIsProduction = () =>
  process.env.NEXT_PUBLIC_ENV === 'production';

export default getClientIsProduction;
