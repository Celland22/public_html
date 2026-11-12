#!/usr/bin/env python3
"""
Export analysis results from Python/R to JSON format for PPTX generation.

This script helps convert analysis results (plots, tables, statistics) 
into a structured JSON format that can be easily consumed by the PPTX 
generation workflow.

Usage:
    python export_analysis_results.py --output results.json

The script expects analysis results in the current directory or can be 
customized to load from specific paths.
"""

import json
import os
import sys
from pathlib import Path
from typing import Dict, List, Any, Optional
import argparse


def create_analysis_structure(
    title: str,
    subtitle: str = "한림대학교 경영학과 황현석 교수",
    sections: Optional[List[Dict[str, Any]]] = None
) -> Dict[str, Any]:
    """
    Create a structured analysis result dictionary.
    
    Args:
        title: Presentation title
        subtitle: Subtitle for title slide
        sections: List of section dictionaries containing content
        
    Returns:
        Structured dictionary ready for JSON export
    """
    structure = {
        "metadata": {
            "title": title,
            "subtitle": subtitle,
            "author": "황현석 교수",
            "institution": "한림대학교 경영학과"
        },
        "sections": sections or []
    }
    
    return structure


def add_methodology_section(
    title: str,
    description: str,
    diagram_path: Optional[str] = None,
    key_points: Optional[List[str]] = None
) -> Dict[str, Any]:
    """
    Create a methodology section.
    
    Args:
        title: Section title
        description: Method description
        diagram_path: Path to methodology diagram image
        key_points: List of key methodological points
        
    Returns:
        Section dictionary
    """
    section = {
        "type": "methodology",
        "title": title,
        "description": description,
        "key_points": key_points or [],
    }
    
    if diagram_path and os.path.exists(diagram_path):
        section["diagram"] = diagram_path
        
    return section


def add_case_study_section(
    title: str,
    context: str,
    problem: str,
    solution: str,
    results: List[str],
    image_path: Optional[str] = None
) -> Dict[str, Any]:
    """
    Create a case study section.
    
    Args:
        title: Case study title
        context: Background context
        problem: Problem statement
        solution: Solution approach
        results: List of key results
        image_path: Optional image for the case study
        
    Returns:
        Section dictionary
    """
    section = {
        "type": "case_study",
        "title": title,
        "context": context,
        "problem": problem,
        "solution": solution,
        "results": results
    }
    
    if image_path and os.path.exists(image_path):
        section["image"] = image_path
        
    return section


def add_visualization_section(
    title: str,
    description: str,
    plot_paths: List[str],
    interpretation: Optional[str] = None
) -> Dict[str, Any]:
    """
    Create a visualization section.
    
    Args:
        title: Section title
        description: Visualization description
        plot_paths: List of paths to plot images
        interpretation: Interpretation of visualizations
        
    Returns:
        Section dictionary
    """
    existing_plots = [p for p in plot_paths if os.path.exists(p)]
    
    section = {
        "type": "visualization",
        "title": title,
        "description": description,
        "plots": existing_plots,
        "interpretation": interpretation or ""
    }
    
    return section


def add_table_section(
    title: str,
    description: str,
    table_data: List[List[Any]],
    headers: List[str],
    interpretation: Optional[str] = None
) -> Dict[str, Any]:
    """
    Create a table section.
    
    Args:
        title: Section title
        description: Table description
        table_data: 2D list of table data
        headers: Column headers
        interpretation: Interpretation of results
        
    Returns:
        Section dictionary
    """
    section = {
        "type": "table",
        "title": title,
        "description": description,
        "headers": headers,
        "data": table_data,
        "interpretation": interpretation or ""
    }
    
    return section


def export_to_json(structure: Dict[str, Any], output_path: str) -> None:
    """
    Export the structure to JSON file.
    
    Args:
        structure: Analysis structure dictionary
        output_path: Path to output JSON file
    """
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(structure, f, ensure_ascii=False, indent=2)
    
    print(f"✅ Analysis results exported to: {output_path}")


def main():
    parser = argparse.ArgumentParser(
        description='Export analysis results to JSON for PPTX generation'
    )
    parser.add_argument(
        '--output', 
        type=str, 
        default='analysis_results.json',
        help='Output JSON file path'
    )
    parser.add_argument(
        '--title',
        type=str,
        default='분석 결과 발표',
        help='Presentation title'
    )
    
    args = parser.parse_args()
    
    # Example structure - users should customize this
    example_structure = create_analysis_structure(
        title=args.title,
        sections=[
            {
                "type": "section_header",
                "title": "1. 연구 배경 및 목적"
            },
            add_methodology_section(
                title="연구 방법론",
                description="본 연구에서는 머신러닝 기법을 활용하여 데이터를 분석하였습니다.",
                key_points=[
                    "데이터 전처리 및 탐색적 분석",
                    "특성 선택 및 엔지니어링",
                    "모델 학습 및 검증",
                    "결과 해석 및 실무 적용 방안 도출"
                ]
            ),
            {
                "type": "section_header",
                "title": "2. 분석 결과"
            },
            {
                "type": "section_header",
                "title": "3. 실무 적용 사례"
            }
        ]
    )
    
    export_to_json(example_structure, args.output)
    
    print("\n📝 To customize this structure:")
    print("1. Import this module in your analysis script")
    print("2. Use the provided functions to add your sections")
    print("3. Export the final structure to JSON")
    print("\nExample:")
    print("  from export_analysis_results import *")
    print("  structure = create_analysis_structure('My Analysis')")
    print("  structure['sections'].append(add_visualization_section(...))")
    print("  export_to_json(structure, 'my_results.json')")


if __name__ == "__main__":
    main()
