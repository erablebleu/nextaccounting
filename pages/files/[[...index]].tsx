import React from "react";
import { Box, Button, Grid, Link, Stack, Typography } from "@mui/material";
import { App } from "../../context/AppContext";
import { useRouter } from "next/router";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import Dropzone from "react-dropzone";
import Spinner from "../../components/Spinner";
import useSWR from "swr";
import { getFetcher } from "../../tools/fetcher";
import { Folder, FolderOpen, InsertDriveFile } from "@mui/icons-material";

export default function Files() {
    const router = useRouter()
    const segments = router.query.index as string[] ?? []
    const path = segments.join('/')
    const { data, error, isLoading } = useSWR(`/api/files/${path}`, getFetcher, {})
    const [dropFiles, setDropFiles] = React.useState<Array<any>>([])

    const handleClick = (item) => {
        switch (item.type) {
            case 'directory':
                router.push(`/files/${[...segments, item.name].join('/')}`, undefined, { shallow: true })
                break
            case 'file':
                App.download(`/api/files/${[...segments, item.name].join('/')}`)
                break
        }
    }
    const handleBack = () => {
        router.push(`/files/${segments.slice(0, segments.length - 1)}`, undefined, { shallow: true })
    }

    App.useHeader(`./${path}`)
    App.useActions((
        <React.Fragment>
            <Button onClick={handleBack} disabled={!segments?.length}>
                ..
            </Button>
        </React.Fragment>
    ), [data])

    const columns: GridColDef[] = [
        {
            field: 'type', headerName: 'Type', width: 50, renderCell: (params) => {
                switch (params.value) {
                    case 'file': return <InsertDriveFile />
                    case 'directory': return <FolderOpen />
                }
                return null
            }
        },
        { field: 'name', headerName: 'Name', flex: 1, renderCell: (params) => (<Link onClick={() => handleClick(params.row)}>{params.value}</Link>) },
        { field: 'size', headerName: 'Size', width: 100, renderCell: App.DataGrid.Renderers.size },
        // { field: 'atime', headerName: 'Access', width: 150, renderCell: App.DataGrid.Renderers.datetime },
        { field: 'mtime', headerName: 'Modif.', width: 150, renderCell: App.DataGrid.Renderers.datetime },
        { field: 'ctime', headerName: 'Status', width: 150, renderCell: App.DataGrid.Renderers.datetime },
    ]

    if (error) return null
    if (!data) return <Spinner />

    return (
        <React.Fragment>
            {/* <Dropzone onDrop={acceptedFiles => {
                setDropFiles([...dropFiles, ...acceptedFiles])
                console.log(acceptedFiles)
            }}>
                {({ getRootProps, getInputProps }) => (
                    <Box>
                        <Box {...getRootProps()}>
                            <input {...getInputProps()} />
                            <p>Drag 'n' drop some files here, or click to select files</p>

                            {dropFiles.map(file => (
                                <Typography key={crypto.randomUUID()}>
                                    {file.name}
                                </Typography>
                            ))}
                        </Box>
                    </Box>
                )}
            </Dropzone> */}
            <DataGrid
                rows={data}
                columns={columns}
                disableRowSelectionOnClick
            />
        </React.Fragment>
    );
}