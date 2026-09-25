import Stack from '@mui/joy/Stack';
import Snackbar from '@mui/joy/Snackbar';

export default function Toast(props: { open: boolean, setOpen?: (value:boolean) => void, message: string }) {
    return (
        <Stack spacing={2} direction="row">
            <Snackbar
                autoHideDuration={3000}
                open={props.open}
                variant={'soft'}
                onClose={(_event, reason) => {
                    if (reason === 'clickaway') {
                        return;
                    }
                    props.setOpen?.(false)
                }}
            >
                {props.message}
            </Snackbar>
        </Stack>
    );
}