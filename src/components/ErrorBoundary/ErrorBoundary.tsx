import { Component, ErrorInfo, ReactNode } from 'react';
import { Box, Alert, Button } from '@mui/material';
import { reportError } from '../../utils/errorReporter';

interface Props {
	children: ReactNode;
	fallback?: ReactNode;
}

interface State {
	hasError: boolean;
	error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
	constructor(props: Props) {
		super(props);
		this.state = { hasError: false, error: null };
	}

	static getDerivedStateFromError(error: Error): State {
		return { hasError: true, error };
	}

	componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
		reportError(error, 'react', errorInfo.componentStack || undefined);
	}

	handleReset = (): void => {
		this.setState({ hasError: false, error: null });
	};

	render(): ReactNode {
		if (this.state.hasError) {
			if (this.props.fallback) {
				return this.props.fallback;
			}

			return (
				<Box sx={{ p: 3 }}>
					<Alert
						severity='error'
						action={
							<Button color='inherit' size='small' onClick={this.handleReset}>
								Try Again
							</Button>
						}>
						Something went wrong. The error has been reported.
					</Alert>
				</Box>
			);
		}

		return this.props.children;
	}
}
