import * as React from 'react';
import { Frame, FrameProperties, PropertyControls, ControlType } from 'framer';
import {
	safariHeader,
	macOSHeader,
	firefoxHeader,
	chromeHeader,
	noHeader
} from './headerStyles';

export interface Props {
	height: number;
	width: number;
	minWidth: number;
	minHeight: number;
	title: string;
	style: string;
	headerHeight: number;
	appearance: boolean;
	scrollable: boolean;
	layouts: React.ReactElement<FrameProperties>[];
	onWidthChange: (widthValue: number) => void;
	onScroll: (scrollY: number) => void;
	onHeightChange: (heightValue: number) => void;
}

export class ResizableWindow extends React.Component<Props> {
	windowStartPointX = 0;
	windowStartPointY = 0;
	panOffsetX = 0;
	panOffsetY = 0;
	cornerStartX = 0;
	cornerStartY = 0;
	cursorStyle;
	maxX;
	maxY;
	cornerStartWidth;
	cornerStartHeight;
	margin = 12;

	state = {
		newX: 0,
		newY: 0,
		newWidth: this.props.width,
		newHeight: this.props.height,
		dragging: false
	};

	static defaultProps = {
		width: 600,
		height: 400,
		minWidth: 200,
		minHeight: 200,
		title: 'Title',
		layouts: [],
		style: 'macOS',
		appearance: true,
		scrollable: true,
		headerHeight: 30
	};

	static propertyControls: PropertyControls = {
		style: {
			type: ControlType.Enum,
			options: ['macOS', 'Safari', 'Firefox', 'Chrome', 'None'],
			title: 'Style'
		},
		appearance: {
			type: ControlType.Boolean,
			enabledTitle: 'Dark',
			disabledTitle: 'Light',
			title: 'Appearance',
			hidden: props =>
				props.style === 'None' || props.style === 'Firefox' || props.style === 'Chrome'
		},
		title: {
			type: ControlType.String,
			title: 'Title',
			hidden: props => props.style === 'None'
		},
		headerHeight: {
			type: ControlType.Number,
			title: 'Header Height',
			hidden: props => props.style !== 'None'
		},
		scrollable: { type: ControlType.Boolean, title: 'Scrollable' },
		minWidth: { type: ControlType.Number, title: 'Min. Width' },
		minHeight: { type: ControlType.Number, title: 'Min. Height' },

		layouts: {
			type: ControlType.Array,
			title: 'Layouts',
			propertyControl: {
				type: ControlType.ComponentInstance
			}
		}
	};

	getLayout = () => {
		const { layouts } = this.props;
		const { newWidth } = this.state;

		const sorted: React.ReactElement<FrameProperties>[] = layouts.sort(
			(l: React.ReactElement<FrameProperties>) => l.props.width as number
		);
		const filtered: React.ReactElement<FrameProperties>[] = sorted.filter(
			(l: React.ReactElement<FrameProperties>) => l.props.width < newWidth
		);
		if (filtered.length === 0) {
			return sorted[0];
		}
		return filtered.pop();
	};

	updateWindowEvents = () => {
		const { onWidthChange, onHeightChange } = this.props;
		onWidthChange && onWidthChange(this.state.newWidth);
		onHeightChange && onHeightChange(this.state.newHeight);
	};

	componentWillReceiveProps(props: Props) {
		if (props.width !== this.props.width) {
			this.setState({ newWidth: Math.max(props.width, this.props.minWidth) });
		}
		if (props.height !== this.props.height) {
			this.setState({
				newHeight: Math.max(props.height, this.props.minHeight)
			});
		}
		if (props.width < this.props.minWidth) {
			this.setState({ newWidth: props.minWidth });
		}
		if (props.height < this.props.minHeight) {
			this.setState({ newHeight: props.minHeight });
		}
	}

	panHeaderHandler = e => {
		this.setState({ newY: e.devicePoint.y - this.windowStartPointY });
		this.panOffsetY = e.devicePoint.y - this.windowStartPointY;
		this.setState({ newX: e.devicePoint.x - this.windowStartPointX });
		this.panOffsetX = e.devicePoint.x - this.windowStartPointX;
		document.body.style.cursor = 'auto';
	};

	panHeaderStartHandler = e => {
		this.windowStartPointY = e.devicePoint.y - this.panOffsetY;
		this.windowStartPointX = e.devicePoint.x - this.panOffsetX;
	};

	cornerPanHandler = (defaultCursor, minCursor, side, e) => {
		this.updateWindowEvents();
		// top
		if (side === 'top' || side === 'topRight' || side === 'topLeft') {
			this.panOffsetY = Math.min(
				e.devicePoint.y - this.cornerStartY,
				this.cornerStartHeight - this.props.minHeight
			);
			this.setState({
				newY: Math.min(
					e.devicePoint.y - this.cornerStartY,
					this.cornerStartHeight - this.props.minHeight
				)
			});
			this.setState({
				newHeight: Math.max(
					this.cornerStartHeight - this.panOffsetY,
					this.props.minHeight
				)
			});
		}

		// bottom
		if (side === 'bottomLeft' || side === 'bottom' || side === 'bottomRight') {
			this.setState({
				newHeight: Math.max(e.devicePoint.y - this.cornerStartY, this.props.minHeight)
			});
		}

		// right
		if (side === 'topRight' || side === 'right' || side === 'bottomRight') {
			this.setState({
				newWidth: Math.max(e.devicePoint.x - this.cornerStartX, this.props.minWidth)
			});
		}

		// left
		if (side === 'topLeft' || side === 'left' || side === 'bottomLeft') {
			this.panOffsetX = Math.min(
				e.devicePoint.x - this.cornerStartX,
				this.cornerStartWidth - this.props.minWidth
			);
			this.setState({
				newX: Math.min(
					e.devicePoint.x - this.cornerStartX,
					this.cornerStartWidth - this.props.minWidth
				)
			});
			this.setState({
				newWidth: Math.max(this.cornerStartWidth - this.panOffsetX, this.props.minWidth)
			});
		}
		this.checkCursor(side, defaultCursor, minCursor);
	};

	cornerPanStartHandler = (side, e) => {
		// top
		if (side === 'top' || side === 'topRight' || side === 'topLeft') {
			this.cornerStartY = e.devicePoint.y - this.panOffsetY;
			this.cornerStartHeight = this.state.newHeight + this.panOffsetY;
			this.maxY = this.state.newY + this.cornerStartHeight - this.props.minHeight;
		}

		// bottom
		if (side === 'bottomLeft' || side === 'bottom' || side === 'bottomRight') {
			this.cornerStartY = e.devicePoint.y - this.state.newHeight;
		}

		// right
		if (side === 'topRight' || side === 'right' || side === 'bottomRight') {
			this.cornerStartX = e.devicePoint.x - this.state.newWidth;
		}

		// left
		if (side === 'topLeft' || side === 'left' || side === 'bottomLeft') {
			this.cornerStartX = e.devicePoint.x - this.panOffsetX;
			this.cornerStartWidth = this.state.newWidth + this.panOffsetX;
			this.maxX = this.state.newX + this.cornerStartWidth - this.props.minWidth;
		}
	};

	mouseEnterHandler = (side, defaultCursor, minCursor) => {
		this.checkCursor(side, defaultCursor, minCursor);
		this.setState({ dragging: true });
	};

	mouseLeaveHandler = () => {
		document.body.style.cursor = 'auto';
		this.setState({ dragging: false });
	};

	panEndHandler = () => {
		if (this.state.dragging === false) {
			document.body.style.cursor = 'auto';
		}
	};

	scrollHandler = e => {
		const { onScroll } = this.props;
		onScroll && onScroll(Math.round(e.target.scrollTop));
	};

	checkCursor = (side, defaultStyle, minStyle) => {
		if (
			side === 'bottomLeft' ||
			side === 'bottomRight' ||
			side === 'topLeft' ||
			side === 'topRight'
		) {
			if (
				this.state.newWidth <= this.props.minWidth &&
				this.state.newHeight <= this.props.minHeight
			) {
				document.body.style.cursor = minStyle;
			} else {
				document.body.style.cursor = defaultStyle;
			}
		} else if (side === 'top' || side === 'bottom') {
			if (this.state.newHeight <= this.props.minHeight) {
				document.body.style.cursor = minStyle;
			} else {
				document.body.style.cursor = defaultStyle;
			}
		} else if (side === 'right' || side === 'left') {
			if (this.state.newWidth <= this.props.minWidth) {
				document.body.style.cursor = minStyle;
			} else {
				document.body.style.cursor = defaultStyle;
			}
		}
	};

	render() {
		let layout;
		let headerHeight =
			this.props.style === 'macOS'
				? 22
				: this.props.style === 'Firefox'
				? 74
				: this.props.style === 'Chrome'
				? 79
				: 0;
		let content;

		layout = this.props.layouts.length === 1 ? this.props.layouts[0] : this.getLayout();

		if (this.props.layouts.length === 0) {
			content = <div style={defaultDisplay}>Connect me →</div>;
		} else {
			let contentHeight = layout.props.height;
			content = React.cloneElement(layout, {
				top: 0,
				left: 0,
				width: this.state.newWidth,
				height:
					this.props.style === 'macOS'
						? this.props.scrollable
							? contentHeight
							: this.state.newHeight - 22
						: this.props.scrollable
						? contentHeight
						: this.props.style === 'Safari'
						? this.state.newHeight - 38
						: this.props.style === 'Firefox'
						? this.state.newHeight - 74
						: this.props.style === 'Chrome'
						? this.state.newHeight - 79
						: this.state.newHeight
			});
		}

		return (
			// Main Window
			<Frame
				left={this.state.newX}
				top={this.state.newY}
				width={this.state.newWidth}
				height={this.state.newHeight}
				style={mainWindow(this.props.style, this.props.appearance)}>
				{scrollRegion(
					this,
					this.props.style,
					this.state.newHeight,
					headerHeight,
					this.state.newWidth,
					content,
					this.props.scrollable
				)}

				{header(
					this,
					this.props.appearance,
					this.props.style,
					this.props.title,
					this.props.headerHeight
				)}

				{edge(this, 'topLeft', 'nwse-resize', 'nw-resize')}
				{edge(this, 'top', 'ns-resize', 'n-resize')}
				{edge(this, 'topRight', 'nesw-resize', 'ne-resize')}
				{edge(this, 'right', 'ew-resize', 'e-resize')}
				{edge(this, 'bottomRight', 'nwse-resize', 'se-resize')}
				{edge(this, 'bottom', 'ns-resize', 's-resize')}
				{edge(this, 'bottomLeft', 'nesw-resize', 'sw-resize')}
				{edge(this, 'left', 'ew-resize', 'w-resize')}
				<div
					style={highlightBorder(
						this.props.style,
						this.props.appearance,
						this.state.newWidth,
						this.state.newHeight
					)}
				/>
			</Frame>
		);
	}
}

function edge(parent: any, side: string, defaultCursor: string, minCursor: string) {
	return (
		<Frame
			style={{ background: null, position: 'absolute' }}
			width={
				side === 'top' || side === 'bottom'
					? parent.state.newWidth - parent.margin
					: parent.margin
			}
			height={
				side === 'right' || side === 'left'
					? parent.state.newHeight - parent.margin
					: parent.margin
			}
			left={
				side === 'left' || side === 'bottomLeft' || side === 'topLeft'
					? -parent.margin / 2
					: side === 'top' || side === 'bottom'
					? parent.margin / 2
					: null
			}
			right={
				side === 'right' || side === 'bottomRight' || side === 'topRight'
					? -parent.margin / 2
					: null
			}
			top={
				side === 'right' || side === 'left'
					? parent.margin / 2
					: side === 'top' || side === 'topRight' || side === 'topLeft'
					? -parent.margin / 2
					: null
			}
			bottom={
				side === 'bottom' || side === 'bottomLeft' || side === 'bottomRight'
					? -parent.margin / 2
					: null
			}
			onPan={parent.cornerPanHandler.bind(parent, defaultCursor, minCursor, side)}
			onPanStart={parent.cornerPanStartHandler.bind(parent, side)}
			onPanEnd={parent.panEndHandler}
			onMouseEnter={parent.mouseEnterHandler.bind(parent, side, defaultCursor, minCursor)}
			onMouseLeave={parent.mouseLeaveHandler}
		/>
	);
}

function highlightBorder(
	style: string,
	appearance: boolean,
	width: number,
	height: number
): React.CSSProperties {
	return {
		boxShadow: appearance
			? style === 'macOS' || style === 'Safari'
				? 'inset 0px 0px 0px 1px rgba(255,255,255,0.15)'
				: null
			: null,
		position: 'absolute',
		left: 0,
		top: 0,
		pointerEvents: 'none',
		width: width,
		height: height,
		borderRadius: style === 'macOS' ? '4px' : '6px'
	};
}

function mainWindow(style: string, appearance: boolean): React.CSSProperties {
	return {
		// background: 'white',
		overflow: 'shown',
		borderRadius: style === 'macOS' ? '4px' : '6px',
		boxShadow: appearance
			? style === 'macOS' || style === 'Safari'
				? '0 24px 30px rgba(0,0,0,0.35), 0 0 0 1px rgba(0,0,0,0.4), 0 0 20px rgba(0,0,0,0.15)'
				: '0 24px 30px rgba(0,0,0,0.35), 0 0 0 1px rgba(0,0,0,0.15), 0 0 20px rgba(0,0,0,0.15)'
			: '0 24px 30px rgba(0,0,0,0.35), 0 0 0 1px rgba(0,0,0,0.15), 0 0 20px rgba(0,0,0,0.15)',

		willChange: 'transform'
	};
}

const defaultDisplay: React.CSSProperties = {
	display: 'flex',
	width: '100%',
	height: '100%',
	background: 'rgba(72, 0, 255, 0.24)',
	color: 'rgba(72, 0, 255, 0.8)',
	justifyContent: 'center',
	alignItems: 'center'
};

function scrollRegion(
	parent: any,
	style: string,
	height: number,
	headerHeight: number,
	width: number,
	content: any,
	scrollable: boolean
) {
	return (
		<Frame
			style={{
				borderRadius:
					style === 'macOS'
						? '0 0 4px 4px'
						: style === 'Firefox' || style === 'Chrome'
						? '0 0 6px 6px'
						: '6px'
			}}
			left={0}
			top={headerHeight}
			width={width}
			height={height - headerHeight}
			overflow={'hidden'}>
			<div
				style={{
					width: '100%',
					height: '100%',
					position: 'relative',
					overflow: scrollable ? 'auto' : 'hidden',
					paddingTop: style === 'Safari' ? 38 : 0,
					background: 'white'
				}}
				onScroll={parent.scrollHandler}>
				{content}
			</div>
		</Frame>
	);
}

function header(
	parent: any,
	appearance: boolean,
	style: string,
	title: string,
	headerHeight: number
) {
	if (style === 'macOS') {
		return macOSHeader(parent, appearance, title, style);
	} else if (style === 'Safari') {
		return safariHeader(parent, appearance, title, style);
	} else if (style === 'None') {
		return noHeader(parent, headerHeight);
	} else if (style === 'Firefox') {
		return firefoxHeader(parent, appearance, title, style);
	} else if (style === 'Chrome') {
		return chromeHeader(parent, appearance, title, style);
	}
}
