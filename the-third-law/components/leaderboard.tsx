import React, { useState } from "react";
import { useContractRead } from "wagmi";

import TheThirdLaw from "../deployments/TheThirdLaw.json";

export type PlayerELO = {
  playerAddress: string;
  eloRating: BigInt;
};

const Leaderboard = () => {
  const [sortedPlayers, setSortedPlayers] = useState<PlayerELO[]>([]);

  const {
    data: playersData,
    error: playersError,
    isLoading: playersLoading,
    isSuccess: playersSuccess,
  } = useContractRead({
    address: TheThirdLaw.address as `0x${string}`,
    abi: TheThirdLaw.abi,
    functionName: "getAllELO",
    watch: true,
    onSettled(data, error) {
      setSortedPlayers(
        (data as PlayerELO[])
          .slice()
          .sort((a, b) => Number(b.eloRating) - Number(a.eloRating))
      );
    },
  });

  // Sort players by ELO score in descending order
  // const sortedPlayers = [...players].sort(
  //   (a, b) => Number(b.ELO) - Number(a.ELO)
  // );

  return (
    <div className="leaderboard">
      <div>
        Warning! If you invite someone and they decline, or ignore the invite,
        you will lose your deposit!
      </div>
      <h2>Leaderboard</h2>
      <table>
        <thead>
          <tr>
            <th>Rank</th>
            <th>Address</th>
            <th>ELO Score</th>
          </tr>
        </thead>
        <tbody>
          {sortedPlayers.map((player, index) => (
            <tr key={player.playerAddress}>
              <td>{index + 1}</td>
              <td>{player.playerAddress}</td>
              <td>{player.eloRating.toString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Leaderboard;
