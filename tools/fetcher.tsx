import { enqueueSnackbar } from "notistack";

export function handleError(res: Response): Response {
  if (!res.ok) {
    enqueueSnackbar('Error fetching data', { variant: 'error' });
    const error = new Error('An error occurred while fetching the data.')    
    throw error
  }

  return res
}


export const getFetcher = async (url: URL) => handleError(await fetch(url, { method: 'GET' })).json()