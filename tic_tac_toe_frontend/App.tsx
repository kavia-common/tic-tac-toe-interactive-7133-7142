import React, { useCallback, useMemo, useRef, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  Pressable,
  LayoutChangeEvent,
  Platform,
} from 'react-native';

/**
 * Color Theme
 * primary: #1976D2
 * secondary: #64B5F6
 * accent: #FFEB3B
 */
const COLORS = {
  background: '#FAFAFA',
  surface: '#FFFFFF',
  primary: '#1976D2',
  secondary: '#64B5F6',
  accent: '#FFEB3B',
  textPrimary: '#0D1B2A',
  textSecondary: '#394B59',
  gridLine: '#E0E0E0',
  gridLineStrong: '#CFD8DC',
  shadow: Platform.select({
    ios: 'rgba(0,0,0,0.1)',
    android: 'rgba(0,0,0,0.2)',
    default: 'rgba(0,0,0,0.1)',
  }) as string,
};

type Player = 'X' | 'O' | null;
type Board = Player[];

// PUBLIC_INTERFACE
export default function App() {
  /** App state */
  const [board, setBoard] = useState<Board>(Array(9).fill(null));
  const [currentPlayer, setCurrentPlayer] = useState<Player>('X');
  const [winner, setWinner] = useState<Player>(null);
  const [winningLine, setWinningLine] = useState<number[] | null>(null);
  const [isTie, setIsTie] = useState<boolean>(false);

  // Grid size handling to keep it square and centered
  const [gridSize, setGridSize] = useState<number>(0);
  const containerWidthRef = useRef<number>(0);

  const handleLayout = (e: LayoutChangeEvent) => {
    const { width } = e.nativeEvent.layout;
    containerWidthRef.current = width;
    // Grid should have some padding. Keep it responsive and centered
    const padding = 32;
    const maxGrid = Math.min(width - padding * 2, 360); // cap for aesthetics
    setGridSize(Math.max(240, Math.floor(maxGrid)));
  };

  /** Helpers */

  // PUBLIC_INTERFACE
  const checkWinner = useCallback((b: Board): { winner: Player; line: number[] | null } => {
    /**
     * Checks the board for a winner.
     * Returns the winning player and the line (indices) or null if no winner.
     */
    const lines: number[][] = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8],
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8],
      [0, 4, 8],
      [2, 4, 6],
    ];
    for (const [a, bIdx, c] of lines) {
      if (b[a] && b[a] === b[bIdx] && b[a] === b[c]) {
        return { winner: b[a], line: [a, bIdx, c] };
      }
    }
    return { winner: null, line: null };
  }, []);

  const statusText = useMemo(() => {
    if (winner && winningLine) return `Player ${winner} wins!`;
    if (isTie) return "It's a tie!";
    return `Player ${currentPlayer}'s turn`;
  }, [currentPlayer, winner, winningLine, isTie]);

  /** Actions */
  const handlePressCell = (index: number) => {
    if (board[index] || winner || isTie) return; // ignore if occupied or game over

    const nextBoard = board.slice();
    nextBoard[index] = currentPlayer;
    const { winner: w, line } = checkWinner(nextBoard);

    setBoard(nextBoard);
    if (w) {
      setWinner(w);
      setWinningLine(line);
      setIsTie(false);
    } else if (nextBoard.every((cell) => cell !== null)) {
      setIsTie(true);
    } else {
      setCurrentPlayer((prev) => (prev === 'X' ? 'O' : 'X'));
    }
  };

  // PUBLIC_INTERFACE
  const resetGame = () => {
    /** Resets the game state to start a new match. */
    setBoard(Array(9).fill(null));
    setCurrentPlayer('X');
    setWinner(null);
    setWinningLine(null);
    setIsTie(false);
  };

  /** Render */

  const renderCell = (index: number) => {
    const value = board[index];
    const isWinning = winningLine?.includes(index) ?? false;

    const cellSize = gridSize / 3;
    const fontSize = Math.floor(cellSize * 0.5);

    return (
      <Pressable
        key={index}
        onPress={() => handlePressCell(index)}
        android_ripple={{ color: COLORS.secondary, borderless: false }}
        accessibilityLabel={`Cell ${index + 1}`}
        accessibilityRole="button"
        accessibilityState={{ disabled: !!value || !!winner || isTie }}
        style={[
          styles.cell,
          {
            width: cellSize,
            height: cellSize,
            borderColor: COLORS.gridLineStrong,
            backgroundColor: isWinning ? COLORS.accent : COLORS.surface,
          },
        ]}
        disabled={!!value || !!winner || isTie}
        testID={`cell-${index}`}
      >
        <Text
          style={[
            styles.cellText,
            {
              fontSize,
              color: value === 'X' ? COLORS.primary : value === 'O' ? '#D32F2F' : COLORS.textPrimary,
            },
          ]}
        >
          {value ?? ''}
        </Text>
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />

      <View onLayout={handleLayout} style={styles.container}>
        {/* Status area */}
        <View style={styles.header}>
          <Text
            style={[
              styles.statusText,
              { color: winner ? COLORS.primary : isTie ? COLORS.textSecondary : COLORS.textPrimary },
            ]}
            accessibilityRole="header"
            testID="status-text"
          >
            {statusText}
          </Text>
        </View>

        {/* Board */}
        <View
          style={[
            styles.boardWrapper,
            {
              width: gridSize,
              height: gridSize,
              borderRadius: 20,
            },
          ]}
        >
          <View style={styles.gridRow}>{[0, 1, 2].map(renderCell)}</View>
          <View style={styles.gridRow}>{[3, 4, 5].map(renderCell)}</View>
          <View style={styles.gridRow}>{[6, 7, 8].map(renderCell)}</View>

          {/* Overlaid grid lines for a clean, modern look */}
          <View pointerEvents="none" style={styles.gridOverlay}>
            {/* Vertical lines */}
            <View
              style={[
                styles.gridLine,
                {
                  left: '33.333%',
                  width: 1,
                  height: '100%',
                  backgroundColor: COLORS.gridLine,
                },
              ]}
            />
            <View
              style={[
                styles.gridLine,
                {
                  left: '66.666%',
                  width: 1,
                  height: '100%',
                  backgroundColor: COLORS.gridLine,
                },
              ]}
            />
            {/* Horizontal lines */}
            <View
              style={[
                styles.gridLine,
                {
                  top: '33.333%',
                  height: 1,
                  width: '100%',
                  backgroundColor: COLORS.gridLine,
                },
              ]}
            />
            <View
              style={[
                styles.gridLine,
                {
                  top: '66.666%',
                  height: 1,
                  width: '100%',
                  backgroundColor: COLORS.gridLine,
                },
              ]}
            />
          </View>
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          <Pressable
            onPress={resetGame}
            style={({ pressed }) => [
              styles.button,
              {
                backgroundColor: pressed ? COLORS.secondary : COLORS.primary,
              },
            ]}
            android_ripple={{ color: COLORS.accent }}
            accessibilityRole="button"
            accessibilityLabel="Start a new game"
            testID="new-game-button"
          >
            <Text style={styles.buttonText}>New Game</Text>
          </Pressable>
        </View>

        {/* Footer / subtle helper */}
        <Text style={styles.helperText} accessibilityLabel="Game instructions">
          Tap a cell to place your mark. First to align three wins.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
  },
  header: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusText: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  boardWrapper: {
    position: 'relative',
    backgroundColor: COLORS.surface,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.gridLineStrong,
    // subtle elevation
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.5,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  gridRow: {
    flexDirection: 'row',
  },
  gridOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  gridLine: {
    position: 'absolute',
  },
  cell: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  cellText: {
    fontWeight: '800',
  },
  controls: {
    width: '100%',
    alignItems: 'center',
  },
  button: {
    minWidth: 180,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    // accent outline glow
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.4,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: 0.4,
  },
  helperText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    opacity: 0.9,
  },
});
