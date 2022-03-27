const getServerIsProduction = () => process.env.NODE_ENV === 'production';

export default getServerIsProduction;
