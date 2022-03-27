import path from 'path';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';

const writeFileAndCreateDirectoryIfNotExists = async (
  filePath: string | string[],
  data: Parameters<typeof writeFile>[1]
) => {
  const actualFilePath = path.resolve(
    ...(Array.isArray(filePath) ? filePath : [filePath])
  );

  const dir = path.dirname(actualFilePath);

  if (!existsSync(dir)) {
    await mkdir(dir, { recursive: true });
  }

  return writeFile(actualFilePath, data);
};

export default writeFileAndCreateDirectoryIfNotExists;
