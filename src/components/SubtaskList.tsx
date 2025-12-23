import React from 'react';
import { Box, List, ListItem, ListItemIcon, ListItemText, Checkbox, Typography } from '@mui/material';
import { CheckCircle as CheckCircleIcon, RadioButtonUnchecked as UncheckedIcon } from '@mui/icons-material';
import { SubtaskItem } from '../types/TaskConfig';
import { evaluateCondition } from '../utils/taskConditions';
import { isSubtaskObject, getSubtaskName, getSubtaskKey } from '../utils/taskHelpers';

export interface SubtaskListProps {
	/** The parent task name (used for generating unique keys) */
	taskName: string;
	/** Array of subtask items to render */
	subtasks: SubtaskItem[];
	/** Event data used for conditional rendering */
	eventData: Record<string, unknown>;
	/** Set of completed subtask keys */
	completedSubtasks: Set<string>;
	/** Callback when a subtask is toggled */
	onToggle: (subtaskPath: string[]) => void;
	/** Internal: current path in the subtask tree */
	pathPrefix?: string[];
	/** Internal: current nesting depth */
	depth?: number;
}

/**
 * Recursive component for rendering a tree of subtasks.
 * Handles nested subtasks, conditional rendering, and completion tracking.
 */
export const SubtaskList: React.FC<SubtaskListProps> = ({
	taskName,
	subtasks,
	eventData,
	completedSubtasks,
	onToggle,
	pathPrefix = [],
	depth = 0,
}) => {
	// Filter subtasks based on their conditions
	const visibleSubtasks = subtasks.filter((subtask) => {
		if (!isSubtaskObject(subtask)) return true;
		return evaluateCondition(subtask.condition, eventData);
	});

	if (visibleSubtasks.length === 0) {
		return null;
	}

	return (
		<List sx={{ pl: depth * 2 }}>
			{visibleSubtasks.map((subtask, index) => {
				const subtaskName = getSubtaskName(subtask);
				const currentPath = [...pathPrefix, subtaskName];
				const subtaskKey = getSubtaskKey(taskName, currentPath);
				const isCompleted = completedSubtasks.has(subtaskKey);
				const hasChildren = isSubtaskObject(subtask) && subtask.subtasks && subtask.subtasks.length > 0;

				return (
					<React.Fragment key={subtaskKey}>
						<ListItem
							sx={{
								py: 1,
								borderBottom: index < visibleSubtasks.length - 1 || hasChildren ? '1px solid' : 'none',
								borderColor: 'divider',
							}}>
							<ListItemIcon>
								<Checkbox
									edge='start'
									checked={isCompleted}
									onChange={() => onToggle(currentPath)}
									icon={<UncheckedIcon />}
									checkedIcon={<CheckCircleIcon color='success' />}
								/>
							</ListItemIcon>
							<ListItemText
								primary={
									<Typography
										variant='body1'
										sx={{
											textDecoration: isCompleted ? 'line-through' : 'none',
											color: isCompleted ? 'text.secondary' : 'text.primary',
											fontWeight: depth === 0 ? 500 : 400,
										}}>
										{subtaskName}
									</Typography>
								}
								secondary={
									isSubtaskObject(subtask) && subtask.description ? (
										<Typography variant='body2' color='text.secondary' sx={{ mt: 0.5 }}>
											{subtask.description}
										</Typography>
									) : null
								}
							/>
						</ListItem>

						{/* Recursively render nested subtasks */}
						{hasChildren && isSubtaskObject(subtask) && (
							<Box sx={{ ml: 2 }}>
								<SubtaskList
									taskName={taskName}
									subtasks={subtask.subtasks!}
									eventData={eventData}
									completedSubtasks={completedSubtasks}
									onToggle={onToggle}
									pathPrefix={currentPath}
									depth={depth + 1}
								/>
							</Box>
						)}
					</React.Fragment>
				);
			})}
		</List>
	);
};
