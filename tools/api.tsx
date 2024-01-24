import { UserRole } from "@prisma/client";
import { NextApiRequest, NextApiResponse } from "next";
import { JWT, getToken } from "next-auth/jwt";

type ApiCallback = (req: NextApiRequest, res: NextApiResponse, session: JWT, options: ApiOption) => Promise<any>
type ApiResultCallback = (req: NextApiRequest, res: NextApiResponse, session: JWT, options: ApiOption, result: any) => Promise<void>

export class ApiOption {
    role?: UserRole
    include?: any
    orderBy?: any
    callback?: ApiCallback
    dateProperty?: string
    allowGenericFilters?: boolean
    doAfter?: ApiResultCallback
}

export async function securize(req: NextApiRequest, res: NextApiResponse, role: UserRole | undefined, callback: (token: JWT) => Promise<void>) {
    const token = await getToken({ req: req })
    if (!token || (role && token.role != role)) {
        res.status(401).json({ message: "you are not allowed" })
    }
    else {
        await callback(token)
    }
}

export async function handleApi(req: NextApiRequest, res: NextApiResponse,
    options: {
        put?: ApiOption | undefined,
        get?: ApiOption | undefined,
        post?: ApiOption | undefined,
        delete?: ApiOption | undefined,
    },
    defaultCallbacks: {
        put?: ApiCallback | undefined,
        get?: ApiCallback | undefined,
        post?: ApiCallback | undefined,
        delete?: ApiCallback | undefined,
    }) {
    const token = await getToken({ req: req })
    const method: string = req.method?.toLowerCase() ?? ''
    const option: ApiOption | undefined = options[method] ? Object.assign({}, options[method]) : undefined
    const role: string | undefined = option?.role
    const callback: ApiCallback | undefined = option?.callback ?? defaultCallbacks[method]

    if (!token || (role && token.role != role)) {
        return res.status(401).json({ message: "you are not allowed" })
    }

    if (!callback || !option) {
        return res.status(405).end(`Method ${req.method} Not Allowed`)
    }

    if (req.query.noincludes != undefined) {
        option.include = undefined
    }

    try {
        const result = await callback(req, res, token, option)
        await option.doAfter?.(req, res, token, option, result)
        return res.status(200).json(result);
    } catch (error) {
        console.error(error)
        res.status(500).json({ error: error.message });
    }
}

export async function handleApiCrudId(req: NextApiRequest, res: NextApiResponse,
    repo: any,
    options: {
        put?: ApiOption | undefined,
        get?: ApiOption | undefined,
        delete?: ApiOption | undefined,
    } = {}) {

    const defaultCallbacks = {
        put: (req: NextApiRequest, res: NextApiResponse, session: any, option: ApiOption) => repo.update({
            where: {
                id: req.query.id,
            },
            data: {
                ...req.body,
                updatedAt: new Date(),
            },
        }),
        get: (req: NextApiRequest, res: NextApiResponse, session: any, option: ApiOption) => repo.findUnique({
            where: {
                id: req.query.id,
            },
            include: option.include,
        }),
        delete: (req: NextApiRequest, res: NextApiResponse, session: any, option: ApiOption) => repo.delete({
            where: {
                id: req.query.id,
            },
        }),
    }

    return handleApi(req, res, options, defaultCallbacks)
}

export function getYearFilter(path: Array<string>, req: NextApiRequest) {
    if (!req.query.y || typeof (req.query.y) !== 'string') {
        return undefined
    }

    const year: number = parseInt(req.query.y)
    return {
        AND: [
            createSubFilter(path, { gte: new Date(year, 0, 1) }),
            createSubFilter(path, { lt: new Date(year + 1, 0, 1) }),
        ]
    }
}

export function getMonthFilter(path: Array<string>, req: NextApiRequest) {
    if (!req.query.y || typeof (req.query.y) !== 'string' || !req.query.m || typeof (req.query.m) !== 'string') {
        return undefined
    }

    const year: number = parseInt(req.query.y)
    const month: number = parseInt(req.query.m)
    return {
        AND: [
            createSubFilter(path, { gte: new Date(year, month - 1, 1) }),
            createSubFilter(path, { lt: new Date(year, month, 1) }),
        ]
    }
}

function createSubFilter(path: Array<string>, value: any) {
    if (path.length == 1) {
        return { [path[0]]: value }
    }
    else {
        return { [path[0]]: createSubFilter(path.slice(1), value) }
    }
}

function getGenericFilter(req: NextApiRequest, option: ApiOption) {
    const filters: Array<any> = []

    for (var prop in req.query) {
        switch (prop) {
            case 'y':
                if (option.dateProperty) {
                    filters.push(getYearFilter(option.dateProperty.split('.'), req))
                }
                break;

            case 'm':
                if (option.dateProperty) {
                    filters.push(getYearFilter(option.dateProperty.split('.'), req))
                }
                break;

            case 'noincludes': break

            default:
                if (option.allowGenericFilters) {
                    filters.push(createSubFilter(prop.split('.'), req.query[prop]))
                }
                break;
        }
    }

    const result = filters.filter(f => f)

    return result.length > 0 ? { AND: result } : undefined
}

export async function handleApiCrudIndex(req: NextApiRequest, res: NextApiResponse,
    repo: any,
    options: {
        get?: ApiOption | undefined,
        post?: ApiOption | undefined,
    } = {}) {

    const defaultCallbacks = {
        get: (req: NextApiRequest, res: NextApiResponse, session: any, option: ApiOption) => repo.findMany({
            include: option.include,
            orderBy: option.orderBy,
            where: getGenericFilter(req, option)
        }),
        post: (req: NextApiRequest, res: NextApiResponse, session: any, option: ApiOption) => {
            return repo.create({
                data: req.body
            })
        },
    }

    return handleApi(req, res, options, defaultCallbacks)
}